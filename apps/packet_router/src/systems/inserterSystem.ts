import { defineQuery, defineSerializer, removeEntity, World } from '@virtcon2/bytenetc';
import {
  Building,
  Conveyor,
  ConveyorItem,
  DIRECTION_VECTORS,
  getOppositeDirection,
  getSerializeConfig,
  getLane,
  Inserter,
  isHorizontalDirection,
  Item,
  Position,
  posToTileKey,
  SerializationID,
  tileSize,
  createItem,
} from '@virtcon2/network-world-entities';
import { syncRemoveEntities } from '../packet/enqueue';
import { defineSystem } from '@virtcon2/bytenetc';
import { inserterQueue } from '../worldBuilding/inserterQueue';
import { SyncEntities } from './types';

const INSERTER_INTERVAL = 20; // Every 20 ticks (1 item/second at 20 TPS)
export const INSERTER_DROP_DELAY = 8; // Drop item after 8 ticks (halfway through 8-frame animation at 10fps)
export const INSERTER_ANIMATION_TICKS = 16; // Full animation cycle: 8 frames at 10fps = 0.8s = 16 ticks at 20 TPS

export const createInserterSystem = (world: World) => {
  const inserterQuery = defineQuery(Inserter, Building, Position);
  const conveyorQuery = defineQuery(Conveyor, Building, Position);
  const conveyorItemQuery = defineQuery(Item, ConveyorItem, Position);
  const buildingQuery = defineQuery(Building, Position);

  let tickCounter = 0;
  const waitingForQueue = new Set<number>();

  /** Check if the output target (conveyor lane or building) has space for an item */
  const checkOutputAvailable = (
    inserterEid: number,
    conveyorMap: Map<string, number>,
    buildingMap: Map<string, number>,
    conveyorItemsByConveyor: Map<number, number[]>,
  ): boolean => {
    const direction = Inserter(world).direction[inserterEid];
    const inserterX = Position(world).x[inserterEid];
    const inserterY = Position(world).y[inserterEid];
    const backDir = getOppositeDirection(direction);
    const backVec = DIRECTION_VECTORS[backDir];
    const backX = inserterX + backVec.x * tileSize;
    const backY = inserterY + backVec.y * tileSize;
    const backKey = posToTileKey(backX, backY);

    const backConveyorEid = conveyorMap.get(backKey);
    if (backConveyorEid !== undefined) {
      const conveyorCenterX = Position(world).x[backConveyorEid];
      const conveyorCenterY = Position(world).y[backConveyorEid];
      const conveyorDir = Conveyor(world).direction[backConveyorEid];
      const horizontal = isHorizontalDirection(conveyorDir);
      const targetLane = horizontal ? getLane(backY, conveyorCenterY) : getLane(backX, conveyorCenterX);

      const itemsOnBackConveyor = conveyorItemsByConveyor.get(backConveyorEid);
      const laneOccupied =
        itemsOnBackConveyor && itemsOnBackConveyor.some((itemEid) => ConveyorItem(world).lane[itemEid] === targetLane);

      return !laneOccupied;
    }

    // For buildings, we can't synchronously check inventory — assume available
    // (the queue will handle the actual check and set enabled=0 if full)
    if (buildingMap.has(backKey)) {
      return true;
    }

    // No valid output target — treat as available (item will be dropped on ground)
    return true;
  };

  return defineSystem<SyncEntities>(({ worldData, sync, removeEntities }) => {
    tickCounter++;

    const inserterEntities = inserterQuery(world);
    if (inserterEntities.length === 0) {
      return { worldData, sync, removeEntities };
    }

    const conveyorEntities = conveyorQuery(world);
    const conveyorItemEntities = conveyorItemQuery(world);
    const allBuildingEntities = buildingQuery(world);

    // Build lookup maps
    const conveyorMap = new Map<string, number>();
    for (const eid of conveyorEntities) {
      const key = posToTileKey(Position(world).x[eid], Position(world).y[eid]);
      conveyorMap.set(key, eid);
    }

    const buildingMap = new Map<string, number>();
    for (const eid of allBuildingEntities) {
      const key = posToTileKey(Position(world).x[eid], Position(world).y[eid]);
      if (!conveyorMap.has(key) && !inserterEntities.includes(eid)) {
        buildingMap.set(key, eid);
      }
    }

    const conveyorItemsByConveyor = new Map<number, number[]>();
    for (const itemEid of conveyorItemEntities) {
      const conveyorEid = ConveyorItem(world).onConveyorEntity[itemEid];
      let items = conveyorItemsByConveyor.get(conveyorEid);
      if (!items) {
        items = [];
        conveyorItemsByConveyor.set(conveyorEid, items);
      }
      items.push(itemEid);
    }

    const removedItemEntities: number[] = [];
    const newItemEntities: number[] = [];

    for (const inserterEid of inserterEntities) {
      const direction = Inserter(world).direction[inserterEid];
      const progressTick = Inserter(world).progressTick[inserterEid];

      // === BUSY (animating/holding) ===
      if (progressTick > 0) {
        // Re-check output availability if disabled
        if (Inserter(world).enabled[inserterEid] === 0) {
          if (checkOutputAvailable(inserterEid, conveyorMap, buildingMap, conveyorItemsByConveyor)) {
            Inserter(world).enabled[inserterEid] = 1;
          } else {
            continue; // Still blocked, stay paused
          }
        }

        // Increment progressTick (only when enabled)
        Inserter(world).progressTick[inserterEid]++;
        const currentTick = Inserter(world).progressTick[inserterEid];

        // At or past drop point: try to drop item (>= allows retry after re-enable from blocked state)
        if (currentTick >= INSERTER_DROP_DELAY && Inserter(world).heldItemId[inserterEid] !== 0 && !waitingForQueue.has(inserterEid)) {
          const heldItemId = Inserter(world).heldItemId[inserterEid];
          const inserterX = Position(world).x[inserterEid];
          const inserterY = Position(world).y[inserterEid];
          const backDir = getOppositeDirection(direction);
          const backVec = DIRECTION_VECTORS[backDir];
          const backX = inserterX + backVec.x * tileSize;
          const backY = inserterY + backVec.y * tileSize;
          const backKey = posToTileKey(backX, backY);

          const backBuildingEid = buildingMap.get(backKey);
          if (backBuildingEid !== undefined) {
            // Enqueue async placement into building inventory
            const targetWorldBuildingId = Building(world).worldBuildingId[backBuildingEid];
            waitingForQueue.add(inserterEid);
            inserterQueue.enqueue({
              type: 'place_into_building',
              world,
              inserterEid,
              itemId: heldItemId,
              targetWorldBuildingId,
              onComplete: () => {
                waitingForQueue.delete(inserterEid);
              },
            });
          } else {
            // Try to drop onto conveyor
            const backConveyorEid = conveyorMap.get(backKey);
            if (backConveyorEid !== undefined) {
              const conveyorCenterX = Position(world).x[backConveyorEid];
              const conveyorCenterY = Position(world).y[backConveyorEid];
              const conveyorDir = Conveyor(world).direction[backConveyorEid];
              const horizontal = isHorizontalDirection(conveyorDir);
              const targetLane = horizontal ? getLane(backY, conveyorCenterY) : getLane(backX, conveyorCenterX);

              const itemsOnBackConveyor = conveyorItemsByConveyor.get(backConveyorEid);
              const laneOccupied =
                itemsOnBackConveyor && itemsOnBackConveyor.some((itemEid) => ConveyorItem(world).lane[itemEid] === targetLane);

              if (laneOccupied) {
                Inserter(world).enabled[inserterEid] = 0;
                continue;
              }
            }

            // Drop item on ground (conveyor system will pick it up if on a conveyor)
            const newItemEid = createItem({
              world,
              itemId: heldItemId,
              x: backX,
              y: backY,
              droppedFromX: backX,
              droppedFromY: backY,
            });
            newItemEntities.push(newItemEid);
            Inserter(world).heldItemId[inserterEid] = 0;
          }
        }

        // At cycle end: reset for next pickup (only if item was successfully dropped)
        if (currentTick >= INSERTER_ANIMATION_TICKS && Inserter(world).heldItemId[inserterEid] === 0) {
          Inserter(world).progressTick[inserterEid] = 0;
          Inserter(world).enabled[inserterEid] = 1;
        } else if (currentTick > INSERTER_ANIMATION_TICKS) {
          // Cap progressTick to prevent overflow while waiting for drop
          Inserter(world).progressTick[inserterEid] = INSERTER_ANIMATION_TICKS;
        }

        continue; // Inserter is busy, skip pickup logic
      }

      // Skip pickup if waiting for async building pickup
      if (waitingForQueue.has(inserterEid)) continue;

      // === PICKUP (front side) — only on INSERTER_INTERVAL ticks ===
      if (Inserter(world).heldItemId[inserterEid] === 0 && tickCounter % INSERTER_INTERVAL === 0) {
        const inserterX = Position(world).x[inserterEid];
        const inserterY = Position(world).y[inserterEid];
        const frontVec = DIRECTION_VECTORS[direction];
        const frontX = inserterX + frontVec.x * tileSize;
        const frontY = inserterY + frontVec.y * tileSize;
        const frontKey = posToTileKey(frontX, frontY);

        // Try to pick up from conveyor at front position
        const frontConveyorEid = conveyorMap.get(frontKey);
        if (frontConveyorEid !== undefined) {
          const itemsOnConveyor = conveyorItemsByConveyor.get(frontConveyorEid);
          if (itemsOnConveyor && itemsOnConveyor.length > 0) {
            const pickedItemEid = itemsOnConveyor[0];
            const pickedItemId = Item(world).itemId[pickedItemEid];

            removeEntity(world, pickedItemEid);
            removedItemEntities.push(pickedItemEid);
            itemsOnConveyor.shift();

            Inserter(world).heldItemId[inserterEid] = pickedItemId;
            Inserter(world).enabled[inserterEid] = 1;
            Inserter(world).progressTick[inserterEid] = 1;
            continue;
          }
        }

        // Try to pick up from building OUTPUT at front position
        const frontBuildingEid = buildingMap.get(frontKey);
        if (frontBuildingEid !== undefined) {
          const worldBuildingId = Building(world).worldBuildingId[frontBuildingEid];
          waitingForQueue.add(inserterEid);
          inserterQueue.enqueue({
            type: 'pickup_from_building',
            world,
            inserterEid,
            worldBuildingId,
            onComplete: () => {
              waitingForQueue.delete(inserterEid);
            },
          });
          continue;
        }
      }
    }

    if (removedItemEntities.length > 0) {
      syncRemoveEntities(world, removedItemEntities);
    }

    if (newItemEntities.length > 0) {
      const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.ITEM]);
      const serializedData = serialize(world, newItemEntities);
      sync.push({
        data: serializedData,
        serializationId: SerializationID.ITEM,
      });
    }

    return { worldData, sync, removeEntities };
  });
};
