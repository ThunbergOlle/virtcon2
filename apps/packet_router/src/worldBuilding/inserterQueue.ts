import { defineSerializer, World } from '@virtcon2/bytenetc';
import {
  addToBuildingInventory,
  AppDataSource,
  InventoryOperationType,
  publishWorldBuildingUpdate,
  WorldBuilding,
  WorldBuildingInventory,
} from '@virtcon2/database-postgres';
import { Animation, getSerializeConfig, Inserter, SerializationID } from '@virtcon2/network-world-entities';
import { WorldBuildingInventorySlotType } from '@virtcon2/static-game-data';
import { log, LogLevel, LogApp } from '@shared';
import { syncServerEntities } from '../packet/enqueue';

interface PickupCommand {
  type: 'pickup_from_building';
  world: World;
  inserterEid: number;
  worldBuildingId: number;
  onComplete: () => void;
}

interface PlaceCommand {
  type: 'place_into_building';
  world: World;
  inserterEid: number;
  itemId: number;
  targetWorldBuildingId: number;
  onComplete: () => void;
}

type InserterCommand = PickupCommand | PlaceCommand;

class InserterQueue {
  private queue: InserterCommand[] = [];
  private processing = false;

  enqueue(command: InserterCommand): void {
    this.queue.push(command);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const command = this.queue.shift();
      try {
        await this.executeCommand(command);
      } catch (error) {
        log(`InserterQueue error: ${error}`, LogLevel.ERROR, LogApp.SERVER);
      }
    }

    this.processing = false;
  }

  private async executeCommand(command: InserterCommand): Promise<void> {
    switch (command.type) {
      case 'pickup_from_building':
        await this.pickupFromBuilding(command);
        break;
      case 'place_into_building':
        await this.placeIntoBuilding(command);
        break;
    }
  }

  private syncInserter(world: World, inserterEid: number): void {
    const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.BUILDING_FULL_SERVER]);
    const serializedData = serialize(world, [inserterEid]);
    syncServerEntities(world, serializedData, SerializationID.BUILDING_FULL_SERVER);
  }

  private async pickupFromBuilding(cmd: PickupCommand): Promise<void> {
    try {
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const inventorySlots = await queryRunner.manager.find(WorldBuildingInventory, {
          where: { world_building: { id: cmd.worldBuildingId } },
          relations: ['item'],
          order: { slot: 'ASC' },
        });

        const outputSlot = inventorySlots.find(
          (slot) =>
            (slot.slotType === WorldBuildingInventorySlotType.OUTPUT ||
              slot.slotType === WorldBuildingInventorySlotType.INPUT_AND_OUTPUT) &&
            slot.itemId &&
            slot.quantity > 0,
        );

        if (!outputSlot) {
          await queryRunner.rollbackTransaction();
          return;
        }

        const pickedItemId = outputSlot.itemId;

        await addToBuildingInventory({
          transaction: queryRunner.manager,
          inventorySlots,
          itemId: pickedItemId,
          quantity: -1,
          operationType: InventoryOperationType.PRODUCTION_OUTPUT,
        });

        await queryRunner.commitTransaction();

        // Update ECS: set held item and start active animation
        const direction = Inserter(cmd.world).direction[cmd.inserterEid];
        Inserter(cmd.world).heldItemId[cmd.inserterEid] = pickedItemId;
        Inserter(cmd.world).enabled[cmd.inserterEid] = 1;
        Animation(cmd.world).animationIndex[cmd.inserterEid] = direction + 4;
        Animation(cmd.world).isPlaying[cmd.inserterEid] = 1;

        this.syncInserter(cmd.world, cmd.inserterEid);
        await publishWorldBuildingUpdate(cmd.worldBuildingId);
      } catch (e) {
        log(`Inserter pickup error: ${e}`, LogLevel.ERROR, LogApp.SERVER);
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    } catch (e) {
      log(`Inserter pickup connection error: ${e}`, LogLevel.ERROR, LogApp.SERVER);
    }

    cmd.onComplete();
  }

  private async placeIntoBuilding(cmd: PlaceCommand): Promise<void> {
    try {
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const worldBuilding = await queryRunner.manager.findOne(WorldBuilding, {
          where: { id: cmd.targetWorldBuildingId },
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
          return;
        }

        const inventorySlots = await queryRunner.manager.find(WorldBuildingInventory, {
          where: { world_building: { id: cmd.targetWorldBuildingId } },
          relations: ['item'],
          order: { slot: 'ASC' },
        });

        const remainder = await addToBuildingInventory({
          transaction: queryRunner.manager,
          inventorySlots,
          itemId: cmd.itemId,
          quantity: 1,
          operationType: InventoryOperationType.TRANSFER_TO_BUILDING,
          processingRequirements: worldBuilding.building.processing_requirements,
          fuelRequirements: worldBuilding.building.fuel_requirements,
        });

        if (remainder > 0) {
          // Inventory full — rollback and pause inserter
          await queryRunner.rollbackTransaction();

          Inserter(cmd.world).enabled[cmd.inserterEid] = 0;
          Animation(cmd.world).animationIndex[cmd.inserterEid] = Inserter(cmd.world).direction[cmd.inserterEid];
          Animation(cmd.world).isPlaying[cmd.inserterEid] = 0;

          this.syncInserter(cmd.world, cmd.inserterEid);
          return;
        }

        await queryRunner.commitTransaction();

        // Clear held item — animation continues in tick loop
        Inserter(cmd.world).heldItemId[cmd.inserterEid] = 0;

        await publishWorldBuildingUpdate(cmd.targetWorldBuildingId);
      } catch (e) {
        log(`Inserter placement error: ${e}`, LogLevel.ERROR, LogApp.SERVER);
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    } catch (e) {
      log(`Inserter placement connection error: ${e}`, LogLevel.ERROR, LogApp.SERVER);
    }

    cmd.onComplete();
  }
}

export const inserterQueue = new InserterQueue();
