import { addComponent, defineQuery, defineSerializer, defineSystem, enterQuery, Not, World } from '@virtcon2/bytenetc';
import {
  Building,
  Collider,
  Conveyor,
  ConveyorItem,
  ConveyorItemState,
  CHECKPOINT_THRESHOLD,
  DIRECTION_VECTORS,
  distance,
  getSerializeConfig,
  getLane,
  getLanePosition,
  isAhead,
  isHorizontalDirection,
  Item,
  MIN_ITEM_DISTANCE,
  Position,
  posToTileKey,
  SerializationID,
  tileSize,
} from '@virtcon2/network-world-entities';
import { SyncEntities } from './types';

// ============ Types ============
interface ItemOnConveyor {
  eid: number;
  x: number;
  y: number;
  conveyorEid: number;
  lane: -1 | 1;
  state: ConveyorItemState;
}

interface ConveyorData {
  eid: number;
  direction: number;
  speed: number;
  centerX: number;
  centerY: number;
  isHorizontal: boolean;
}

// ============ Helper Functions ============
const buildConveyorMap = (world: World, conveyors: number[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const eid of conveyors) {
    const key = posToTileKey(Position(world).x[eid], Position(world).y[eid]);
    map.set(key, eid);
  }
  return map;
};

const getConveyorData = (world: World, eid: number): ConveyorData => {
  const direction = Conveyor(world).direction[eid];
  return {
    eid,
    direction,
    speed: Conveyor(world).speed[eid],
    centerX: Position(world).x[eid],
    centerY: Position(world).y[eid],
    isHorizontal: isHorizontalDirection(direction),
  };
};

const findConveyorAt = (conveyorMap: Map<string, number>, px: number, py: number): number | null => {
  return conveyorMap.get(posToTileKey(px, py)) ?? null;
};

const checkCollisionInLane = (
  item: ItemOnConveyor,
  newX: number,
  newY: number,
  itemsInLane: ItemOnConveyor[],
  dirVec: { x: number; y: number }
): boolean => {
  const newPos = { x: newX, y: newY };
  for (const other of itemsInLane) {
    if (other.eid === item.eid) continue;
    const otherPos = { x: other.x, y: other.y };
    if (distance(newPos, otherPos) < MIN_ITEM_DISTANCE && isAhead(newPos, otherPos, dirVec)) {
      return true;
    }
  }
  return false;
};

const hasRoomInLane = (
  itemsByConveyorLane: Map<number, Map<number, ItemOnConveyor[]>>,
  conveyorEid: number,
  lane: number
): boolean => {
  const laneMap = itemsByConveyorLane.get(conveyorEid);
  if (!laneMap) return true;
  const itemsInLane = laneMap.get(lane);
  return !itemsInLane || itemsInLane.length === 0;
};

const addToItemsByConveyorLane = (
  itemsByConveyorLane: Map<number, Map<number, ItemOnConveyor[]>>,
  conveyorEid: number,
  lane: number,
  item: ItemOnConveyor
): void => {
  if (!itemsByConveyorLane.has(conveyorEid)) {
    itemsByConveyorLane.set(conveyorEid, new Map());
  }
  const laneMap = itemsByConveyorLane.get(conveyorEid)!;
  if (!laneMap.has(lane)) {
    laneMap.set(lane, []);
  }
  laneMap.get(lane)!.push(item);
};

// ============ State Handlers ============
const processAligning = (
  world: World,
  item: ItemOnConveyor,
  conveyor: ConveyorData,
  changedEntities: number[]
): void => {
  const targetLanePos = getLanePosition(conveyor.isHorizontal ? conveyor.centerY : conveyor.centerX, item.lane);

  const currentPerp = conveyor.isHorizontal ? item.y : item.x;
  const distToTarget = Math.abs(currentPerp - targetLanePos);

  if (distToTarget <= CHECKPOINT_THRESHOLD) {
    // Reached checkpoint - snap to lane and transition to MOVING state
    ConveyorItem(world).reachedCheckpoint[item.eid] = ConveyorItemState.MOVING;
    if (conveyor.isHorizontal) {
      Position(world).y[item.eid] = targetLanePos;
    } else {
      Position(world).x[item.eid] = targetLanePos;
    }
  } else {
    // Move toward checkpoint
    const moveAmount = Math.min(conveyor.speed, distToTarget);
    const moveDir = currentPerp < targetLanePos ? 1 : -1;
    if (conveyor.isHorizontal) {
      Position(world).y[item.eid] = currentPerp + moveDir * moveAmount;
    } else {
      Position(world).x[item.eid] = currentPerp + moveDir * moveAmount;
    }
  }

  if (!changedEntities.includes(item.eid)) {
    changedEntities.push(item.eid);
  }
};

const processMoving = (
  world: World,
  item: ItemOnConveyor,
  conveyor: ConveyorData,
  itemsByConveyorLane: Map<number, Map<number, ItemOnConveyor[]>>,
  conveyorMap: Map<string, number>,
  changedEntities: number[]
): void => {
  const dirVec = DIRECTION_VECTORS[conveyor.direction];

  // Calculate new position
  const newX = item.x + dirVec.x * conveyor.speed;
  const newY = item.y + dirVec.y * conveyor.speed;

  // Check collision with items ahead on current conveyor in same lane
  const laneMap = itemsByConveyorLane.get(item.conveyorEid);
  const itemsInLane = laneMap?.get(item.lane) ?? [];
  if (checkCollisionInLane(item, newX, newY, itemsInLane, dirVec)) {
    return; // Blocked - don't move
  }

  // Check if moving past center of current conveyor
  const distFromCenterAlongDir = (newX - conveyor.centerX) * dirVec.x + (newY - conveyor.centerY) * dirVec.y;
  const isPastCenter = distFromCenterAlongDir > 0;

  if (isPastCenter) {
    // Check for next conveyor at edge of current tile
    const edgeCheckX = conveyor.centerX + dirVec.x * (tileSize / 2 + 1);
    const edgeCheckY = conveyor.centerY + dirVec.y * (tileSize / 2 + 1);
    const nextConveyorEid = findConveyorAt(conveyorMap, edgeCheckX, edgeCheckY);

    if (nextConveyorEid === null) {
      // No connecting piece - stop at center
      snapToCenter(world, item, conveyor, changedEntities);
      return;
    }

    // Check if next conveyor has room in this lane
    if (!hasRoomInLane(itemsByConveyorLane, nextConveyorEid, item.lane)) {
      snapToCenter(world, item, conveyor, changedEntities);
      return;
    }
  }

  // Check if new position transitions to a new conveyor
  const nextConveyorEid = findConveyorAt(conveyorMap, newX, newY);

  if (nextConveyorEid !== null && nextConveyorEid !== item.conveyorEid) {
    // Transitioning to new conveyor
    const nextDirection = Conveyor(world).direction[nextConveyorEid];
    const isNextHorizontal = isHorizontalDirection(nextDirection);
    const isPerpendicular = conveyor.isHorizontal !== isNextHorizontal;

    Position(world).x[item.eid] = newX;
    Position(world).y[item.eid] = newY;
    ConveyorItem(world).onConveyorEntity[item.eid] = nextConveyorEid;

    if (isPerpendicular) {
      ConveyorItem(world).reachedCheckpoint[item.eid] = ConveyorItemState.ALIGNING;
    }
  } else if (nextConveyorEid === item.conveyorEid) {
    // Still on same conveyor - just move
    Position(world).x[item.eid] = newX;
    Position(world).y[item.eid] = newY;
  }
  // If nextConveyorEid is null, we already handled it above (stop at center)

  if (!changedEntities.includes(item.eid)) {
    changedEntities.push(item.eid);
  }
};

const snapToCenter = (world: World, item: ItemOnConveyor, conveyor: ConveyorData, changedEntities: number[]): void => {
  const stoppedX = conveyor.isHorizontal ? conveyor.centerX : item.x;
  const stoppedY = conveyor.isHorizontal ? item.y : conveyor.centerY;

  if (item.x !== stoppedX || item.y !== stoppedY) {
    Position(world).x[item.eid] = stoppedX;
    Position(world).y[item.eid] = stoppedY;
    if (!changedEntities.includes(item.eid)) {
      changedEntities.push(item.eid);
    }
  }
};

// ============ System Factory ============
export const createConveyorSystem = (world: World) => {
  const conveyorQuery = defineQuery(Conveyor, Building, Position);
  const itemNotOnConveyorQuery = defineQuery(Item, Position, Not(ConveyorItem));
  const newItemsQuery = enterQuery(itemNotOnConveyorQuery);
  const conveyorItemQuery = defineQuery(Item, ConveyorItem, Position);

  return defineSystem<SyncEntities>(({ worldData, sync, removeEntities }) => {
    const conveyorEntities = conveyorQuery(world);
    const newItems = newItemsQuery(world);
    const conveyorItemEntities = conveyorItemQuery(world);
    const changedEntities: number[] = [];

    // Build lookup maps
    const conveyorMap = buildConveyorMap(world, conveyorEntities);
    const itemsByConveyorLane = new Map<number, Map<number, ItemOnConveyor[]>>();

    // Build items by conveyor and lane for collision/capacity checking
    for (const itemEid of conveyorItemEntities) {
      const conveyorEid = ConveyorItem(world).onConveyorEntity[itemEid];
      const lane = ConveyorItem(world).lane[itemEid] as -1 | 1;
      const state = ConveyorItem(world).reachedCheckpoint[itemEid] as ConveyorItemState;

      const item: ItemOnConveyor = {
        eid: itemEid,
        x: Position(world).x[itemEid],
        y: Position(world).y[itemEid],
        conveyorEid,
        lane,
        state,
      };

      addToItemsByConveyorLane(itemsByConveyorLane, conveyorEid, lane, item);
    }

    // Step 1: Detect newly dropped items entering conveyors
    for (const itemEid of newItems) {
      const itemX = Position(world).x[itemEid];
      const itemY = Position(world).y[itemEid];
      const conveyorEid = findConveyorAt(conveyorMap, itemX, itemY);

      if (conveyorEid === null) continue;

      const conveyor = getConveyorData(world, conveyorEid);
      const itemLane = conveyor.isHorizontal
        ? getLane(itemY, conveyor.centerY)
        : getLane(itemX, conveyor.centerX);

      if (!hasRoomInLane(itemsByConveyorLane, conveyorEid, itemLane)) continue;

      // Add ConveyorItem component
      addComponent(world, ConveyorItem, itemEid);
      ConveyorItem(world).onConveyorEntity[itemEid] = conveyorEid;
      ConveyorItem(world).reachedCheckpoint[itemEid] = ConveyorItemState.ALIGNING;
      ConveyorItem(world).lane[itemEid] = itemLane;
      Collider(world).static[itemEid] = 0;

      // Add to tracking map
      const newItem: ItemOnConveyor = {
        eid: itemEid,
        x: itemX,
        y: itemY,
        conveyorEid,
        lane: itemLane,
        state: ConveyorItemState.ALIGNING,
      };
      addToItemsByConveyorLane(itemsByConveyorLane, conveyorEid, itemLane, newItem);
      changedEntities.push(itemEid);
    }

    // Step 2: Process items already on conveyors
    for (const [conveyorEid, laneMap] of itemsByConveyorLane) {
      // Verify conveyor still exists
      const conveyorKey = posToTileKey(Position(world).x[conveyorEid], Position(world).y[conveyorEid]);
      if (!conveyorMap.has(conveyorKey)) continue;

      const conveyor = getConveyorData(world, conveyorEid);

      for (const [, items] of laneMap) {
        for (const item of items) {
          // Refresh item position (may have been updated by earlier iterations)
          item.x = Position(world).x[item.eid];
          item.y = Position(world).y[item.eid];
          item.state = ConveyorItem(world).reachedCheckpoint[item.eid] as ConveyorItemState;

          switch (item.state) {
            case ConveyorItemState.ALIGNING:
              processAligning(world, item, conveyor, changedEntities);
              break;
            case ConveyorItemState.MOVING:
              processMoving(world, item, conveyor, itemsByConveyorLane, conveyorMap, changedEntities);
              break;
          }
        }
      }
    }

    // Sync changed items
    if (changedEntities.length > 0) {
      const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.CONVEYOR_ITEM]);
      const serializedData = serialize(world, changedEntities);

      sync.push({
        data: serializedData,
        serializationId: SerializationID.CONVEYOR_ITEM,
      });
    }

    return { worldData, sync, removeEntities };
  });
};
