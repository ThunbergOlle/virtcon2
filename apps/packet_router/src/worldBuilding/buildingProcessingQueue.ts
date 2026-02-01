import { pMap } from '@shared';
import { defineQuery, defineSerializer, Entity, World } from '@virtcon2/bytenetc';
import {
  addToBuildingInventory,
  AppDataSource,
  InventoryOperationType,
  publishWorldBuildingUpdate,
  safelyMoveItemsBetweenInventories,
  WorldBuilding,
  WorldResource,
} from '@virtcon2/database-postgres';
import { Animation, Building, getSerializeConfig, SerializationID } from '@virtcon2/network-world-entities';
import { DBBuilding, getItemByName, ResourceNames, Resources, WorldBuildingInventorySlotType } from '@virtcon2/static-game-data';
import { EntityManager, IsNull, Not } from 'typeorm';
import { syncServerEntities } from '../packet/enqueue';

// Animation indices
const ANIMATION_IDLE = 0;
const ANIMATION_ACTIVE = 1;

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

/**
 * Updates the animation state for a building entity in the ECS world.
 */
function setBuildingAnimation(worldId: World, worldBuildingId: number, isActive: boolean): void {
  const buildingQuery = defineQuery(Building, Animation);
  const entities = buildingQuery(worldId);

  const updatedEntities: Entity[] = [];

  for (const eid of entities) {
    if (Building(worldId).worldBuildingId[eid] === worldBuildingId) {
      const prevAnimationState = Animation(worldId).animationIndex[eid];
      if (isActive && prevAnimationState === ANIMATION_ACTIVE) continue;
      if (!isActive && prevAnimationState === ANIMATION_IDLE) continue;

      Animation(worldId).animationIndex[eid] = isActive ? ANIMATION_ACTIVE : ANIMATION_IDLE;
      updatedEntities.push(eid);
      break;
    }
  }
  const serialize = defineSerializer(getSerializeConfig(worldId)[SerializationID.BUILDING_FULL_SERVER]);
  const serializedBuilding = serialize(worldId, updatedEntities);

  syncServerEntities(worldId, serializedBuilding, SerializationID.BUILDING_FULL_SERVER);
}

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
    const hasRequirements = building.processing_requirements.length > 0 || building.fuel_requirements.length > 0;

    // Resource extractor with requirements (dynamic output based on resource)
    if (building.items_to_be_placed_on.length > 0 && hasRequirements && building.output_item === null) {
      await this.processResourceExtractingBuildingWithRequirements(worldId, building);
    } else if (!hasRequirements && (building.output_item || building.items_to_be_placed_on.length)) {
      await this.processResourceExtractingBuilding(worldId, building);
    } else if (hasRequirements) {
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
            return addToBuildingInventory({
              transaction,
              inventorySlots: worldBuilding.world_building_inventory,
              itemId: building.output_item.id,
              quantity: building.output_quantity,
              operationType: InventoryOperationType.PRODUCTION_OUTPUT,
            });
          }
        },
        { concurrency: 10 },
      );
    });

    // Simple extractors are always active
    for (const worldBuilding of worldBuildings) {
      setBuildingAnimation(worldId, worldBuilding.id, true);
    }

    await pMap(worldBuildings, (worldBuilding) => publishWorldBuildingUpdate(worldBuilding.id));
  }

  private async processResourceExtractingBuildingWithRequirements(worldId: World, building: DBBuilding): Promise<void> {
    const worldBuildings = await WorldBuilding.find({
      where: { building: { id: building.id }, world: { id: worldId } },
      relations: [
        'world_building_inventory',
        'building.fuel_requirements',
        'building.fuel_requirements.item',
        'building.processing_requirements',
        'building.processing_requirements.item',
      ],
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

    // Track which buildings can process
    const buildingActiveState = new Map<number, boolean>();

    await AppDataSource.manager.transaction(async (transaction: EntityManager) => {
      await pMap(
        worldBuildings,
        async (worldBuilding) => {
          // Check if fuel requirements are met
          const fuelRequirementsMet = building.fuel_requirements.every((req) => {
            const inventory = worldBuilding.world_building_inventory
              .filter((inventory) => inventory.slotType === WorldBuildingInventorySlotType.FUEL)
              .find((inv) => inv.itemId === req.item.id);
            return inventory && inventory.quantity >= req.quantity;
          });

          // Check if processing requirements are met
          const processingRequirementsMet = building.processing_requirements.every((req) => {
            const inventory = worldBuilding.world_building_inventory
              .filter((inventory) => inventory.slotType === WorldBuildingInventorySlotType.INPUT)
              .find((inv) => inv.itemId === req.item.id);
            return inventory && inventory.quantity >= req.quantity;
          });

          const requirementsMet = fuelRequirementsMet && processingRequirementsMet;

          // Get the linked resource
          const resource = resourceByBuildingId.get(worldBuilding.id);
          const hasResource = resource && resource.quantity > 0;

          // Track active state for animation
          buildingActiveState.set(worldBuilding.id, requirementsMet && hasResource);

          if (!requirementsMet || !hasResource) return;

          // Get output item from resource type
          const resourceConfig = Resources[resource.resourceName as ResourceNames];
          if (!resourceConfig) return;

          const outputItem = getItemByName(resourceConfig.item);
          if (!outputItem) return;

          // Consume fuel requirements
          await pMap(building.fuel_requirements, (requirement) =>
            addToBuildingInventory({
              transaction,
              inventorySlots: worldBuilding.world_building_inventory,
              itemId: requirement.item.id,
              quantity: -requirement.quantity,
              operationType: InventoryOperationType.FUEL_CONSUMPTION,
            }),
          );

          // Consume processing requirements
          await pMap(building.processing_requirements, (requirement) =>
            addToBuildingInventory({
              transaction,
              inventorySlots: worldBuilding.world_building_inventory,
              itemId: requirement.item.id,
              quantity: -requirement.quantity,
              operationType: InventoryOperationType.INPUT_CONSUMPTION,
            }),
          );

          // Coal bonus: when drilling coal, produce 4 instead of 2
          const outputQuantity = resource.resourceName === ResourceNames.COAL ? 4 : building.output_quantity ?? 2;

          // Add output to inventory (OUTPUT slots only)
          await addToBuildingInventory({
            transaction,
            inventorySlots: worldBuilding.world_building_inventory,
            itemId: outputItem.id,
            quantity: outputQuantity,
            operationType: InventoryOperationType.PRODUCTION_OUTPUT,
          });

          // Reduce resource quantity
          resource.quantity = Math.max(0, resource.quantity - 1);
          await transaction.save(resource);
        },
        { concurrency: 10 },
      );
    });

    // Update animations based on active state
    for (const [worldBuildingId, isActive] of buildingActiveState) {
      setBuildingAnimation(worldId, worldBuildingId, isActive);
    }

    await pMap(worldBuildings, (worldBuilding) => publishWorldBuildingUpdate(worldBuilding.id));
  }

  private async processBuildingWithRequirements(worldId: World, building: DBBuilding): Promise<void> {
    const worldBuildings = await WorldBuilding.find({
      where: { building: { id: building.id }, world: { id: worldId } },
      relations: [
        'world_building_inventory',
        'building.fuel_requirements',
        'building.fuel_requirements.item',
        'building.processing_requirements',
        'building.processing_requirements.item',
      ],
    });

    // Track which buildings can process
    const buildingActiveState = new Map<number, boolean>();

    await AppDataSource.manager.transaction(async (transaction: EntityManager) => {
      await pMap(worldBuildings, async (worldBuilding) => {
        // Check if fuel requirements are met
        const fuelRequirementsMet = building.fuel_requirements.every((req) => {
          const inventory = worldBuilding.world_building_inventory
            .filter((inventory) => inventory.slotType === WorldBuildingInventorySlotType.FUEL)
            .find((inv) => inv.itemId === req.item.id);
          return inventory && inventory.quantity >= req.quantity;
        });

        // Check if processing requirements are met
        const processingRequirementsMet = building.processing_requirements.every((req) => {
          const inventory = worldBuilding.world_building_inventory
            .filter((inventory) => inventory.slotType === WorldBuildingInventorySlotType.INPUT)
            .find((inv) => inv.itemId === req.item.id);
          return inventory && inventory.quantity >= req.quantity;
        });

        const requirementsMet = fuelRequirementsMet && processingRequirementsMet;

        // Track active state for animation
        buildingActiveState.set(worldBuilding.id, requirementsMet);

        if (!requirementsMet) return;

        // Consume fuel requirements
        await pMap(building.fuel_requirements, (requirement) =>
          addToBuildingInventory({
            transaction,
            inventorySlots: worldBuilding.world_building_inventory,
            itemId: requirement.item.id,
            quantity: -requirement.quantity,
            operationType: InventoryOperationType.FUEL_CONSUMPTION,
          }),
        );

        // Consume processing requirements
        await pMap(building.processing_requirements, (requirement) =>
          addToBuildingInventory({
            transaction,
            inventorySlots: worldBuilding.world_building_inventory,
            itemId: requirement.item.id,
            quantity: -requirement.quantity,
            operationType: InventoryOperationType.INPUT_CONSUMPTION,
          }),
        );

        // Add output to inventory (OUTPUT slots only)
        await addToBuildingInventory({
          transaction,
          inventorySlots: worldBuilding.world_building_inventory,
          itemId: building.output_item.id,
          quantity: building.output_quantity,
          operationType: InventoryOperationType.PRODUCTION_OUTPUT,
        });
      });
    });

    // Update animations based on active state
    for (const [worldBuildingId, isActive] of buildingActiveState) {
      setBuildingAnimation(worldId, worldBuildingId, isActive);
    }

    await pMap(worldBuildings, (worldBuilding) => publishWorldBuildingUpdate(worldBuilding.id));
  }

  private async processInventoryTransfers(worldId: World): Promise<void> {
    const worldBuildings = await WorldBuilding.find({
      where: { world: { id: worldId }, output_world_building: Not(IsNull()) },
      relations: [
        'building',
        'world_building_inventory',
        'output_world_building',
        'output_world_building.building',
        'output_world_building.building.fuel_requirements',
        'output_world_building.building.fuel_requirements.item',
        'output_world_building.building.processing_requirements',
        'output_world_building.building.processing_requirements.item',
        'output_world_building.world_building_inventory',
        'output_world_building.world_building_inventory.item',
      ],
    });

    for (const worldBuilding of worldBuildings) {
      // Only transfer from OUTPUT slots
      const itemsToMove = worldBuilding.world_building_inventory.find(
        (inv) => inv.itemId && inv.slotType === WorldBuildingInventorySlotType.OUTPUT,
      );
      if (!itemsToMove) continue;

      // Get the target building's requirements for slot type determination
      const targetBuilding = worldBuilding.output_world_building.building;
      const processingRequirements = targetBuilding?.processing_requirements ?? [];
      const fuelRequirements = targetBuilding?.fuel_requirements ?? [];

      await safelyMoveItemsBetweenInventories({
        fromId: worldBuilding.id,
        toId: worldBuilding.output_world_building.id,
        itemId: itemsToMove.itemId,
        quantity: Math.min(itemsToMove.quantity, worldBuilding.building.inventory_transfer_quantity_per_cycle),
        fromType: 'building',
        toType: 'building',
        fromSlot: itemsToMove.slot,
        processingRequirements,
        fuelRequirements,
      });
    }
  }
}

export const buildingProcessingQueue = new BuildingProcessingQueue();
