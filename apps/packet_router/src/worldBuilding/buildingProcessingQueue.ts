import { pMap } from '@shared';
import { World } from '@virtcon2/bytenetc';
import {
  addToInventory,
  AppDataSource,
  publishWorldBuildingUpdate,
  safelyMoveItemsBetweenInventories,
  WorldBuilding,
} from '@virtcon2/database-postgres';
import { DBBuilding } from '@virtcon2/static-game-data';
import { EntityManager, IsNull, Not } from 'typeorm';

interface ProcessBuildingCommand {
  type: 'process_building';
  worldId: World;
  buildingType: DBBuilding;
}

interface TransferInventoriesCommand {
  type: 'transfer_inventories';
  worldId: World;
}

type ProcessingCommand = ProcessBuildingCommand | TransferInventoriesCommand;

class BuildingProcessingQueue {
  private queue: ProcessingCommand[] = [];
  private processing = false;

  enqueue(command: ProcessingCommand): void {
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
        console.error('BuildingProcessingQueue error:', error);
      }
    }

    this.processing = false;
  }

  private async executeCommand(command: ProcessingCommand): Promise<void> {
    switch (command.type) {
      case 'process_building':
        await this.processBuilding(command.worldId, command.buildingType);
        break;
      case 'transfer_inventories':
        await this.processInventoryTransfers(command.worldId);
        break;
    }
  }

  private async processBuilding(worldId: World, building: DBBuilding): Promise<void> {
    if (!building.processing_requirements.length && (building.output_item || building.items_to_be_placed_on.length)) {
      await this.processResourceExtractingBuilding(worldId, building);
    } else if (building.processing_requirements.length) {
      await this.processBuildingWithRequirements(worldId, building);
    }
  }

  private async processResourceExtractingBuilding(worldId: World, building: DBBuilding): Promise<void> {
    const worldBuildings = await WorldBuilding.find({
      where: { building: { id: building.id }, world: { id: worldId } },
      relations: ['world_building_inventory'],
    });

    await AppDataSource.manager.transaction(async (transaction: EntityManager) => {
      await pMap(
        worldBuildings,
        async (worldBuilding) => {
          if (building.output_item?.id) {
            return addToInventory(transaction, worldBuilding.world_building_inventory, building.output_item.id, building.output_quantity);
          }
        },
        { concurrency: 10 },
      );
    });

    await pMap(worldBuildings, (worldBuilding) => publishWorldBuildingUpdate(worldBuilding.id));
  }

  private async processBuildingWithRequirements(worldId: World, building: DBBuilding): Promise<void> {
    const worldBuildings = await WorldBuilding.find({
      where: { building: { id: building.id }, world: { id: worldId } },
      relations: ['world_building_inventory'],
    });

    await AppDataSource.manager.transaction(async (transaction: EntityManager) => {
      await pMap(worldBuildings, async (worldBuilding) => {
        const requirementsMet = building.processing_requirements.every((req) => {
          const inventory = worldBuilding.world_building_inventory.find((inv) => inv.itemId === req.item.id);
          return inventory && inventory.quantity >= req.quantity;
        });

        if (!requirementsMet) return;

        await pMap(building.processing_requirements, (requirement) =>
          addToInventory(transaction, worldBuilding.world_building_inventory, requirement.item.id, -requirement.quantity),
        );

        await addToInventory(transaction, worldBuilding.world_building_inventory, building.output_item.id, building.output_quantity);
      });
    });

    await pMap(worldBuildings, (worldBuilding) => publishWorldBuildingUpdate(worldBuilding.id));
  }

  private async processInventoryTransfers(worldId: World): Promise<void> {
    const worldBuildings = await WorldBuilding.find({
      where: { world: { id: worldId }, output_world_building: Not(IsNull()) },
      relations: [
        'building',
        'world_building_inventory',
        'output_world_building',
        'output_world_building.world_building_inventory',
        'output_world_building.world_building_inventory.item',
      ],
    });

    for (const worldBuilding of worldBuildings) {
      const itemsToMove = worldBuilding.world_building_inventory.find((inv) => inv.itemId);
      if (!itemsToMove) continue;

      await safelyMoveItemsBetweenInventories({
        fromId: worldBuilding.id,
        toId: worldBuilding.output_world_building.id,
        itemId: itemsToMove.itemId,
        quantity: Math.min(itemsToMove.quantity, worldBuilding.building.inventory_transfer_quantity_per_cycle),
        fromType: 'building',
        toType: 'building',
      });
    }
  }
}

export const buildingProcessingQueue = new BuildingProcessingQueue();
