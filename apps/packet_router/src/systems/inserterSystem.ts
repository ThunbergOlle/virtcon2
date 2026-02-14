import { defineQuery, defineSerializer, removeEntity, World } from '@virtcon2/bytenetc';
import {
  addToBuildingInventory,
  AppDataSource,
  InventoryOperationType,
  publishWorldBuildingUpdate,
  WorldBuilding,
  WorldBuildingInventory,
} from '@virtcon2/database-postgres';
import {
  Animation,
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
import { WorldBuildingInventorySlotType } from '@virtcon2/static-game-data';
import { log, LogLevel, LogApp } from '@shared';
import { syncRemoveEntities, syncServerEntities } from '../packet/enqueue';
import { defineSystem } from '@virtcon2/bytenetc';
import { SyncEntities } from './types';

const INSERTER_INTERVAL = 20; // Every 20 ticks (1 item/second at 20 TPS)

interface PendingTransfer {
  itemId: number;
  targetWorldBuildingId: number;
}

export const createInserterSystem = (world: World) => {
  const inserterQuery = defineQuery(Inserter, Building, Position);
  const conveyorQuery = defineQuery(Conveyor, Building, Position);
  const conveyorItemQuery = defineQuery(Item, ConveyorItem, Position);
  const buildingQuery = defineQuery(Building, Position);

  let tickCounter = 0;
  const pendingTransfers = new Map<number, PendingTransfer>();

  return defineSystem<SyncEntities>(({ worldData, sync, removeEntities }) => {
    tickCounter++;
    if (tickCounter % INSERTER_INTERVAL !== 0) {
      return { worldData, sync, removeEntities };
    }

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

    // Building map: tileKey → building entity ID (non-conveyor, non-inserter buildings)
    const buildingMap = new Map<string, number>();
    for (const eid of allBuildingEntities) {
      const key = posToTileKey(Position(world).x[eid], Position(world).y[eid]);
      // Only include buildings that are not conveyors and not inserters
      if (!conveyorMap.has(key) && !inserterEntities.includes(eid)) {
        buildingMap.set(key, eid);
      }
    }

    // Items by conveyor: conveyorEid → item entities on that conveyor
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

    const changedInserterEntities: number[] = [];
    const removedItemEntities: number[] = [];
    const newItemEntities: number[] = [];

    for (const inserterEid of inserterEntities) {
      // Skip if a pending transfer is in progress for this inserter
      if (pendingTransfers.has(inserterEid)) continue;

      const direction = Inserter(world).direction[inserterEid];
      const heldItemId = Inserter(world).heldItemId[inserterEid];
      const inserterX = Position(world).x[inserterEid];
      const inserterY = Position(world).y[inserterEid];

      const frontVec = DIRECTION_VECTORS[direction];
      const backDir = getOppositeDirection(direction);
      const backVec = DIRECTION_VECTORS[backDir];

      const frontX = inserterX + frontVec.x * tileSize;
      const frontY = inserterY + frontVec.y * tileSize;
      const backX = inserterX + backVec.x * tileSize;
      const backY = inserterY + backVec.y * tileSize;

      const frontKey = posToTileKey(frontX, frontY);
      const backKey = posToTileKey(backX, backY);

      // === PICKUP (front side) ===
      if (heldItemId === 0) {
        // Try to pick up from conveyor at front position
        const frontConveyorEid = conveyorMap.get(frontKey);
        if (frontConveyorEid !== undefined) {
          const itemsOnConveyor = conveyorItemsByConveyor.get(frontConveyorEid);
          if (itemsOnConveyor && itemsOnConveyor.length > 0) {
            const pickedItemEid = itemsOnConveyor[0];
            const pickedItemId = Item(world).itemId[pickedItemEid];

            // Remove item from ECS
            removeEntity(world, pickedItemEid);
            removedItemEntities.push(pickedItemEid);

            // Remove from our tracking
            itemsOnConveyor.shift();

            // Set held item
            Inserter(world).heldItemId[inserterEid] = pickedItemId;
            Inserter(world).enabled[inserterEid] = 1;
            Animation(world).animationIndex[inserterEid] = direction + 4; // active for this direction
            Animation(world).isPlaying[inserterEid] = 1;

            if (!changedInserterEntities.includes(inserterEid)) {
              changedInserterEntities.push(inserterEid);
            }
            continue; // Don't place in same tick as pickup
          }
        }

        // Try to pick up from building OUTPUT at front position
        const frontBuildingEid = buildingMap.get(frontKey);
        if (frontBuildingEid !== undefined) {
          const worldBuildingId = Building(world).worldBuildingId[frontBuildingEid];
          // Enqueue async pickup from building output
          pickupFromBuildingOutput(world, inserterEid, worldBuildingId, changedInserterEntities, pendingTransfers);
          continue;
        }
      }

      // === PLACEMENT (back side) ===
      if (heldItemId !== 0) {
        const backBuildingEid = buildingMap.get(backKey);
        if (backBuildingEid !== undefined) {
          // Place into building inventory
          const targetWorldBuildingId = Building(world).worldBuildingId[backBuildingEid];
          placeIntoBuildingInventory(world, inserterEid, heldItemId, targetWorldBuildingId, changedInserterEntities, pendingTransfers);
        } else {
          // Check if there's a conveyor at the back position
          const backConveyorEid = conveyorMap.get(backKey);
          if (backConveyorEid !== undefined) {
            // Items dropped at conveyor center always land in lane 1,
            // so check if that specific lane has room
            const conveyorCenterX = Position(world).x[backConveyorEid];
            const conveyorCenterY = Position(world).y[backConveyorEid];
            const conveyorDir = Conveyor(world).direction[backConveyorEid];
            const horizontal = isHorizontalDirection(conveyorDir);
            const targetLane = horizontal ? getLane(backY, conveyorCenterY) : getLane(backX, conveyorCenterX);

            const itemsOnBackConveyor = conveyorItemsByConveyor.get(backConveyorEid);
            const laneOccupied =
              itemsOnBackConveyor &&
              itemsOnBackConveyor.some((itemEid) => ConveyorItem(world).lane[itemEid] === targetLane);

            if (laneOccupied) {
              // Target lane full — wait until next cycle
              Inserter(world).enabled[inserterEid] = 0;
              Animation(world).animationIndex[inserterEid] = direction; // idle for this direction
              Animation(world).isPlaying[inserterEid] = 0;
              if (!changedInserterEntities.includes(inserterEid)) {
                changedInserterEntities.push(inserterEid);
              }
              continue;
            }
          }

          // Drop item on ground (conveyor system will pick it up if on a conveyor)
          const newItemEid = createItem({
            world,
            itemId: heldItemId,
            x: backX,
            y: backY,
          });
          newItemEntities.push(newItemEid);

          Inserter(world).heldItemId[inserterEid] = 0;
          Inserter(world).enabled[inserterEid] = 1;
          Animation(world).animationIndex[inserterEid] = direction; // idle for this direction
          Animation(world).isPlaying[inserterEid] = 1;

          if (!changedInserterEntities.includes(inserterEid)) {
            changedInserterEntities.push(inserterEid);
          }
        }
      }
    }

    // Sync changed inserter entities
    if (changedInserterEntities.length > 0) {
      const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.BUILDING_FULL_SERVER]);
      const serializedData = serialize(world, changedInserterEntities);
      syncServerEntities(world, serializedData, SerializationID.BUILDING_FULL_SERVER);
    }

    // Sync removed item entities
    if (removedItemEntities.length > 0) {
      syncRemoveEntities(world, removedItemEntities);
    }

    // Sync new item entities (dropped on ground)
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

async function pickupFromBuildingOutput(
  world: World,
  inserterEid: number,
  worldBuildingId: number,
  changedInserterEntities: number[],
  pendingTransfers: Map<number, PendingTransfer>,
) {
  // Mark as pending to prevent re-processing
  pendingTransfers.set(inserterEid, { itemId: 0, targetWorldBuildingId: worldBuildingId });

  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inventorySlots = await queryRunner.manager.find(WorldBuildingInventory, {
        where: { world_building: { id: worldBuildingId } },
        relations: ['item'],
        order: { slot: 'ASC' },
      });

      // Find first OUTPUT slot with items
      const outputSlot = inventorySlots.find(
        (slot) => slot.slotType === WorldBuildingInventorySlotType.OUTPUT && slot.itemId && slot.quantity > 0,
      );

      if (!outputSlot) {
        await queryRunner.rollbackTransaction();
        pendingTransfers.delete(inserterEid);
        return;
      }

      const pickedItemId = outputSlot.itemId;

      // Remove 1 item from the output slot
      await addToBuildingInventory({
        transaction: queryRunner.manager,
        inventorySlots,
        itemId: pickedItemId,
        quantity: -1,
        operationType: InventoryOperationType.PRODUCTION_OUTPUT,
      });

      await queryRunner.commitTransaction();

      // Update ECS state
      const direction = Inserter(world).direction[inserterEid];
      Inserter(world).heldItemId[inserterEid] = pickedItemId;
      Inserter(world).enabled[inserterEid] = 1;
      Animation(world).animationIndex[inserterEid] = direction + 4; // active for this direction
      Animation(world).isPlaying[inserterEid] = 1;

      if (!changedInserterEntities.includes(inserterEid)) {
        changedInserterEntities.push(inserterEid);
      }

      // Sync the inserter entity change
      const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.BUILDING_FULL_SERVER]);
      const serializedData = serialize(world, [inserterEid]);
      syncServerEntities(world, serializedData, SerializationID.BUILDING_FULL_SERVER);

      await publishWorldBuildingUpdate(worldBuildingId);
    } catch (e) {
      log(`Inserter pickup error: ${e}`, LogLevel.ERROR, LogApp.SERVER);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  } catch (e) {
    log(`Inserter pickup connection error: ${e}`, LogLevel.ERROR, LogApp.SERVER);
  }

  pendingTransfers.delete(inserterEid);
}

async function placeIntoBuildingInventory(
  world: World,
  inserterEid: number,
  itemId: number,
  targetWorldBuildingId: number,
  changedInserterEntities: number[],
  pendingTransfers: Map<number, PendingTransfer>,
) {
  // Mark as pending to prevent re-processing
  pendingTransfers.set(inserterEid, { itemId, targetWorldBuildingId });

  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const worldBuilding = await queryRunner.manager.findOne(WorldBuilding, {
        where: { id: targetWorldBuildingId },
        relations: [
          'building',
          'building.fuel_requirements',
          'building.fuel_requirements.item',
          'building.processing_requirements',
          'building.processing_requirements.item',
        ],
      });

      if (!worldBuilding) {
        await queryRunner.rollbackTransaction();
        pendingTransfers.delete(inserterEid);
        return;
      }

      const inventorySlots = await queryRunner.manager.find(WorldBuildingInventory, {
        where: { world_building: { id: targetWorldBuildingId } },
        relations: ['item'],
        order: { slot: 'ASC' },
      });

      const remainder = await addToBuildingInventory({
        transaction: queryRunner.manager,
        inventorySlots,
        itemId,
        quantity: 1,
        operationType: InventoryOperationType.TRANSFER_TO_BUILDING,
        processingRequirements: worldBuilding.building.processing_requirements,
        fuelRequirements: worldBuilding.building.fuel_requirements,
      });

      if (remainder > 0) {
        // Inventory is full — rollback and disable inserter
        await queryRunner.rollbackTransaction();
        const direction = Inserter(world).direction[inserterEid];
        Inserter(world).enabled[inserterEid] = 0;
        Animation(world).animationIndex[inserterEid] = direction; // idle for this direction
        Animation(world).isPlaying[inserterEid] = 0;

        if (!changedInserterEntities.includes(inserterEid)) {
          changedInserterEntities.push(inserterEid);
        }

        const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.BUILDING_FULL_SERVER]);
        const serializedData = serialize(world, [inserterEid]);
        syncServerEntities(world, serializedData, SerializationID.BUILDING_FULL_SERVER);

        pendingTransfers.delete(inserterEid);
        return;
      }

      await queryRunner.commitTransaction();

      // Clear held item
      const direction = Inserter(world).direction[inserterEid];
      Inserter(world).heldItemId[inserterEid] = 0;
      Inserter(world).enabled[inserterEid] = 1;
      Animation(world).animationIndex[inserterEid] = direction; // idle for this direction
      Animation(world).isPlaying[inserterEid] = 1;

      if (!changedInserterEntities.includes(inserterEid)) {
        changedInserterEntities.push(inserterEid);
      }

      const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.BUILDING_FULL_SERVER]);
      const serializedData = serialize(world, [inserterEid]);
      syncServerEntities(world, serializedData, SerializationID.BUILDING_FULL_SERVER);

      await publishWorldBuildingUpdate(targetWorldBuildingId);
    } catch (e) {
      log(`Inserter placement error: ${e}`, LogLevel.ERROR, LogApp.SERVER);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  } catch (e) {
    log(`Inserter placement connection error: ${e}`, LogLevel.ERROR, LogApp.SERVER);
  }

  pendingTransfers.delete(inserterEid);
}
