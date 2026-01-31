import { pMap } from '@shared';
import { World } from '@virtcon2/bytenetc';
import {
  addToInventory,
  AppDataSource,
  publishWorldBuildingUpdate,
  safelyMoveItemsBetweenInventories,
  WorldBuilding,
  WorldResource,
} from '@virtcon2/database-postgres';
import { DBBuilding, getItemByName, ResourceNames, Resources } from '@virtcon2/static-game-data';
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
    // Resource extractor with requirements (dynamic output based on resource)
    if (
      building.items_to_be_placed_on.length > 0 &&
      building.processing_requirements.length > 0 &&
      building.output_item === null
    ) {
      await this.processResourceExtractingBuildingWithRequirements(worldId, building);
    } else if (!building.processing_requirements.length && (building.output_item || building.items_to_be_placed_on.length)) {
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

  private async processResourceExtractingBuildingWithRequirements(worldId: World, building: DBBuilding): Promise<void> {
    const worldBuildings = await WorldBuilding.find({
      where: { building: { id: building.id }, world: { id: worldId } },
      relations: ['world_building_inventory'],
    });

    // Get all world resources that have a linked building
    const worldResources = await WorldResource.find({
      where: { worldId: worldId, worldBuildingId: Not(IsNull()) },
    });

    // Create a map for quick lookup
    const resourceByBuildingId = new Map<number, WorldResource>();
    for (const resource of worldResources) {
      if (resource.worldBuildingId) {
        resourceByBuildingId.set(resource.worldBuildingId, resource);
      }
    }

    await AppDataSource.manager.transaction(async (transaction: EntityManager) => {
      await pMap(
        worldBuildings,
        async (worldBuilding) => {
          // Check if processing requirements are met
          const requirementsMet = building.processing_requirements.every((req) => {
            const inventory = worldBuilding.world_building_inventory.find((inv) => inv.itemId === req.item.id);
            return inventory && inventory.quantity >= req.quantity;
          });

          if (!requirementsMet) return;

          // Get the linked resource
          const resource = resourceByBuildingId.get(worldBuilding.id);
          if (!resource || resource.quantity <= 0) return;

          // Get output item from resource type
          const resourceConfig = Resources[resource.resourceName as ResourceNames];
          if (!resourceConfig) return;

          const outputItem = getItemByName(resourceConfig.item);
          if (!outputItem) return;

          // Consume requirements
          await pMap(building.processing_requirements, (requirement) =>
            addToInventory(transaction, worldBuilding.world_building_inventory, requirement.item.id, -requirement.quantity),
          );

          // Coal bonus: when drilling coal, produce 4 instead of 2
          const outputQuantity = resource.resourceName === ResourceNames.COAL ? 4 : (building.output_quantity ?? 2);

          // Add output to inventory
          await addToInventory(transaction, worldBuilding.world_building_inventory, outputItem.id, outputQuantity);

          // Reduce resource quantity
          resource.quantity = Math.max(0, resource.quantity - 1);
          await transaction.save(resource);
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
