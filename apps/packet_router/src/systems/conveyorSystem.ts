import { addComponent, defineQuery, defineSerializer, defineSystem, Not, World } from '@virtcon2/bytenetc';
import {
  Building,
  Collider,
  Conveyor,
  ConveyorItem,
  getSerializeConfig,
  Item,
  Position,
  SerializationID,
  tileSize,
} from '@virtcon2/network-world-entities';
import { SyncEntities } from './types';

// Direction vectors: 0=right, 1=down, 2=left, 3=up
const DIRECTION_VECTORS = [
  { x: 1, y: 0 }, // right
  { x: 0, y: 1 }, // down
  { x: -1, y: 0 }, // left
  { x: 0, y: -1 }, // up
];

// Minimum distance between items on conveyor (item size)
const MIN_ITEM_DISTANCE = 8;

// Distance threshold to consider item "at checkpoint" (at its lane position)
const CHECKPOINT_THRESHOLD = 1;

// Maximum items per conveyor (one per lane)
const MAX_ITEMS_PER_CONVEYOR = 2;

// Lane offset from center (items go to center +/- this offset)
const LANE_OFFSET = 4;

// Helper to determine which "lane" an item is in (perpendicular to movement)
// Returns -1 for left/upper lane, 1 for right/lower lane
const getLane = (itemPos: number, conveyorCenter: number): number => {
  // Always assign to a lane - no center lane
  return itemPos < conveyorCenter ? -1 : 1;
};

// Helper to get the target position for a lane
const getLanePosition = (conveyorCenter: number, lane: number): number => {
  return conveyorCenter + lane * LANE_OFFSET;
};

export const createConveyorSystem = (world: World) => {
  const conveyorQuery = defineQuery(Conveyor, Building, Position);
  const itemNotOnConveyorQuery = defineQuery(Item, Position, Not(ConveyorItem));
  const conveyorItemQuery = defineQuery(Item, ConveyorItem, Position);

  return defineSystem<SyncEntities>(({ worldData, sync, removeEntities }) => {
    const conveyorEntities = conveyorQuery(world);
    const itemsNotOnConveyor = itemNotOnConveyorQuery(world);
    const conveyorItemEntities = conveyorItemQuery(world);
    const changedEntities: number[] = [];

    // Build a lookup map of conveyor positions for fast collision detection
    // Key: "tileX,tileY" -> conveyor entity
    const conveyorMap = new Map<string, number>();
    for (let i = 0; i < conveyorEntities.length; i++) {
      const eid = conveyorEntities[i];
      const x = Position(world).x[eid];
      const y = Position(world).y[eid];
      const tileX = Math.floor(x / tileSize);
      const tileY = Math.floor(y / tileSize);
      conveyorMap.set(`${tileX},${tileY}`, eid);
    }

    // Helper: find conveyor at a pixel position
    const findConveyorAt = (px: number, py: number): number | null => {
      const tileX = Math.floor(px / tileSize);
      const tileY = Math.floor(py / tileSize);
      return conveyorMap.get(`${tileX},${tileY}`) ?? null;
    };

    // Build a map of items per conveyor for capacity checking (keyed by conveyor, then by lane)
    const itemsByConveyorLane = new Map<number, Map<number, { eid: number; x: number; y: number }[]>>();
    for (let i = 0; i < conveyorItemEntities.length; i++) {
      const itemEid = conveyorItemEntities[i];
      const conveyorEid = ConveyorItem(world).onConveyorEntity[itemEid];
      const lane = ConveyorItem(world).lane[itemEid];

      if (!itemsByConveyorLane.has(conveyorEid)) {
        itemsByConveyorLane.set(conveyorEid, new Map());
      }
      const laneMap = itemsByConveyorLane.get(conveyorEid)!;
      if (!laneMap.has(lane)) {
        laneMap.set(lane, []);
      }
      laneMap.get(lane)!.push({
        eid: itemEid,
        x: Position(world).x[itemEid],
        y: Position(world).y[itemEid],
      });
    }

    // Helper: check if a conveyor has room for an item in a specific lane
    const hasRoomInLane = (conveyorEid: number, lane: number): boolean => {
      const laneMap = itemsByConveyorLane.get(conveyorEid);
      if (!laneMap) return true; // No items on this conveyor

      const itemsInLane = laneMap.get(lane);
      if (!itemsInLane || itemsInLane.length === 0) return true; // Lane is empty

      // Lane has at least one item - no room
      return false;
    };

    // Helper: get all items on a conveyor (both lanes)
    const getItemsOnConveyor = (conveyorEid: number): { eid: number; x: number; y: number }[] => {
      const laneMap = itemsByConveyorLane.get(conveyorEid);
      if (!laneMap) return [];
      const items: { eid: number; x: number; y: number }[] = [];
      for (const laneItems of laneMap.values()) {
        items.push(...laneItems);
      }
      return items;
    };

    // Step 1: Detect items entering conveyors (items without ConveyorItem component)
    for (let i = 0; i < itemsNotOnConveyor.length; i++) {
      const itemEid = itemsNotOnConveyor[i];

      const itemX = Position(world).x[itemEid];
      const itemY = Position(world).y[itemEid];
      const conveyorEid = findConveyorAt(itemX, itemY);

      if (conveyorEid !== null) {
        // Determine which lane this item should go to based on entry position
        const conveyorDir = Conveyor(world).direction[conveyorEid];
        const conveyorIsHorizontal = conveyorDir === 0 || conveyorDir === 2;
        const conveyorCenterX = Position(world).x[conveyorEid];
        const conveyorCenterY = Position(world).y[conveyorEid];

        const itemLane = conveyorIsHorizontal
          ? getLane(itemY, conveyorCenterY)
          : getLane(itemX, conveyorCenterX);

        if (!hasRoomInLane(conveyorEid, itemLane)) {
          // Lane is full - item can't enter
          continue;
        }

        // Item is on a conveyor - add ConveyorItem component
        addComponent(world, ConveyorItem, itemEid);
        ConveyorItem(world).onConveyorEntity[itemEid] = conveyorEid;
        ConveyorItem(world).reachedCheckpoint[itemEid] = 0; // Must reach lane position first
        ConveyorItem(world).lane[itemEid] = itemLane; // Store the lane

        // Make item dynamic (moveable)
        Collider(world).static[itemEid] = 0;

        // Add to itemsByConveyorLane so subsequent items in this tick see it
        if (!itemsByConveyorLane.has(conveyorEid)) {
          itemsByConveyorLane.set(conveyorEid, new Map());
        }
        const laneMap = itemsByConveyorLane.get(conveyorEid)!;
        if (!laneMap.has(itemLane)) {
          laneMap.set(itemLane, []);
        }
        laneMap.get(itemLane)!.push({ eid: itemEid, x: itemX, y: itemY });

        changedEntities.push(itemEid);
      }
    }

    // Step 2: Move items on conveyors and handle collisions
    // Sort items by position along conveyor direction to handle stacking properly
    const itemsOnConveyors: { eid: number; x: number; y: number; conveyorEid: number }[] = [];

    for (let i = 0; i < conveyorItemEntities.length; i++) {
      const itemEid = conveyorItemEntities[i];
      const conveyorEid = ConveyorItem(world).onConveyorEntity[itemEid];

      // Verify the conveyor still exists
      if (
        !conveyorMap.has(
          `${Math.floor(Position(world).x[conveyorEid] / tileSize)},${Math.floor(Position(world).y[conveyorEid] / tileSize)}`,
        )
      ) {
        continue;
      }

      itemsOnConveyors.push({
        eid: itemEid,
        x: Position(world).x[itemEid],
        y: Position(world).y[itemEid],
        conveyorEid,
      });
    }

    // Process each item
    for (const item of itemsOnConveyors) {
      const { eid: itemEid, conveyorEid } = item;
      const direction = Conveyor(world).direction[conveyorEid];
      const speed = Conveyor(world).speed[conveyorEid];
      const dirVec = DIRECTION_VECTORS[direction];
      const reachedCheckpoint = ConveyorItem(world).reachedCheckpoint[itemEid];

      const currentX = Position(world).x[itemEid];
      const currentY = Position(world).y[itemEid];
      const conveyorCenterX = Position(world).x[conveyorEid];
      const conveyorCenterY = Position(world).y[conveyorEid];

      // Determine if item is horizontal or vertical moving
      const isHorizontal = direction === 0 || direction === 2;

      // Get the item's assigned lane
      const itemLane = ConveyorItem(world).lane[itemEid];

      // Phase 1: Move toward checkpoint (lane position on perpendicular axis)
      if (reachedCheckpoint === 0) {
        let targetX = currentX;
        let targetY = currentY;

        if (isHorizontal) {
          // Moving horizontally - need to move to lane on Y axis
          targetY = getLanePosition(conveyorCenterY, itemLane);
        } else {
          // Moving vertically - need to move to lane on X axis
          targetX = getLanePosition(conveyorCenterX, itemLane);
        }

        const distToCheckpoint = Math.sqrt((currentX - targetX) ** 2 + (currentY - targetY) ** 2);

        if (distToCheckpoint <= CHECKPOINT_THRESHOLD) {
          // Reached checkpoint - snap to lane and start moving in conveyor direction
          ConveyorItem(world).reachedCheckpoint[itemEid] = 1;
          Position(world).x[itemEid] = targetX;
          Position(world).y[itemEid] = targetY;

          if (!changedEntities.includes(itemEid)) {
            changedEntities.push(itemEid);
          }
        } else {
          // Move toward checkpoint
          const dx = targetX - currentX;
          const dy = targetY - currentY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const moveX = (dx / dist) * Math.min(speed, dist);
          const moveY = (dy / dist) * Math.min(speed, dist);

          Position(world).x[itemEid] = currentX + moveX;
          Position(world).y[itemEid] = currentY + moveY;

          if (!changedEntities.includes(itemEid)) {
            changedEntities.push(itemEid);
          }
        }
        continue; // Don't process normal movement until checkpoint reached
      }

      // Phase 2: Normal conveyor movement (checkpoint reached)
      // Calculate new position
      const newX = currentX + dirVec.x * speed;
      const newY = currentY + dirVec.y * speed;

      // Check if item is trying to move past the center of the conveyor
      const distFromCenterAlongDir = (newX - conveyorCenterX) * dirVec.x + (newY - conveyorCenterY) * dirVec.y;
      const isPastCenter = distFromCenterAlongDir > 0;

      // Check collision with items ahead on current conveyor
      let blocked = false;
      for (const otherItem of itemsOnConveyors) {
        if (otherItem.eid === itemEid) continue;

        const otherX = Position(world).x[otherItem.eid];
        const otherY = Position(world).y[otherItem.eid];

        // Calculate distance between items
        const dx = newX - otherX;
        const dy = newY - otherY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < MIN_ITEM_DISTANCE) {
          // Check if this item is ahead in the conveyor direction
          const dotProduct = dx * dirVec.x + dy * dirVec.y;
          if (dotProduct > 0) {
            // Other item is ahead - we're blocked
            blocked = true;
            break;
          }
        }
      }

      if (blocked) {
        // Can't move - blocked by another item
        continue;
      }

      // If moving past center, check if there's a connecting conveyor
      if (isPastCenter) {
        // Check for next conveyor at the edge of current tile
        const edgeCheckX = conveyorCenterX + dirVec.x * (tileSize / 2 + 1);
        const edgeCheckY = conveyorCenterY + dirVec.y * (tileSize / 2 + 1);
        const nextConveyorEid = findConveyorAt(edgeCheckX, edgeCheckY);

        if (nextConveyorEid === null) {
          // No connecting piece - stop at center (along movement axis)
          const stoppedX = isHorizontal ? conveyorCenterX : currentX;
          const stoppedY = isHorizontal ? currentY : conveyorCenterY;
          if (currentX !== stoppedX || currentY !== stoppedY) {
            Position(world).x[itemEid] = stoppedX;
            Position(world).y[itemEid] = stoppedY;
            if (!changedEntities.includes(itemEid)) {
              changedEntities.push(itemEid);
            }
          }
          continue;
        }

        // There's a next conveyor - check if it has room
        const nextDirection = Conveyor(world).direction[nextConveyorEid];
        const isNextHorizontal = nextDirection === 0 || nextDirection === 2;
        const isPerpendicular = isHorizontal !== isNextHorizontal;

        // Determine item's lane on the next conveyor
        // Lane is preserved across transitions (same lane number maps to same relative side)
        const itemLaneOnNext = itemLane;

        if (!hasRoomInLane(nextConveyorEid, itemLaneOnNext)) {
          // Next conveyor is full in this lane - stop at center (along movement axis)
          const stoppedX = isHorizontal ? conveyorCenterX : currentX;
          const stoppedY = isHorizontal ? currentY : conveyorCenterY;
          if (currentX !== stoppedX || currentY !== stoppedY) {
            Position(world).x[itemEid] = stoppedX;
            Position(world).y[itemEid] = stoppedY;
            if (!changedEntities.includes(itemEid)) {
              changedEntities.push(itemEid);
            }
          }
          continue;
        }
      }

      // Check if new position transitions to a new conveyor
      const nextConveyorEid = findConveyorAt(newX, newY);

      if (nextConveyorEid !== null && nextConveyorEid !== conveyorEid) {
        // Transitioning to new conveyor
        const nextDirection = Conveyor(world).direction[nextConveyorEid];
        const isNextHorizontal = nextDirection === 0 || nextDirection === 2;
        const isPerpendicular = isHorizontal !== isNextHorizontal;

        // Move item
        Position(world).x[itemEid] = newX;
        Position(world).y[itemEid] = newY;
        ConveyorItem(world).onConveyorEntity[itemEid] = nextConveyorEid;

        if (isPerpendicular) {
          ConveyorItem(world).reachedCheckpoint[itemEid] = 0; // Must reach new checkpoint
        }

        if (!changedEntities.includes(itemEid)) {
          changedEntities.push(itemEid);
        }
      } else if (nextConveyorEid === conveyorEid) {
        // Still on same conveyor - just move
        Position(world).x[itemEid] = newX;
        Position(world).y[itemEid] = newY;

        if (!changedEntities.includes(itemEid)) {
          changedEntities.push(itemEid);
        }
      }
      // If nextConveyorEid is null, we already handled it above (stop at center)
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
