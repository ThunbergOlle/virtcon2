import { pMap } from '@shared';
import { defineQuery, defineSerializer, Entity, World } from '@virtcon2/bytenetc';
import {
  addToBuildingInventory,
  AppDataSource,
  AssemblerWorldBuilding,
  InventoryOperationType,
  publishWorldBuildingUpdate,
  WorldBuilding,
  WorldResource,
} from '@virtcon2/database-postgres';
import { Animation, Assembler, Building, getSerializeConfig, SerializationID } from '@virtcon2/network-world-entities';
import { all_db_items_recipes, DBBuilding, DBItemName, getItemByName, ResourceNames, Resources, WorldBuildingInventorySlotType } from '@virtcon2/static-game-data';
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

type ProcessingCommand = ProcessBuildingCommand;

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
    }
  }

  private async processBuilding(worldId: World, building: DBBuilding): Promise<void> {
    if (building.name === DBItemName.BUILDING_ASSEMBLER) {
      await this.processAssemblerBuilding(worldId, building);
      return;
    }

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

  private async processAssemblerBuilding(worldId: World, building: DBBuilding): Promise<void> {
    const worldBuildings = await WorldBuilding.find({
      where: { building: { id: building.id }, world: { id: worldId } },
      relations: ['world_building_inventory'],
    });

    // Build ECS entity map: worldBuildingId → eid
    const assemblerQuery = defineQuery(Building, Assembler);
    const assemblerEntities = assemblerQuery(worldId);
    const ecsEntityMap = new Map<number, Entity>();
    for (const eid of assemblerEntities) {
      ecsEntityMap.set(Building(worldId).worldBuildingId[eid], eid);
    }

    const buildingsNeedingUpdate: number[] = [];

    await AppDataSource.manager.transaction(async (transaction: EntityManager) => {
      await pMap(
        worldBuildings,
        async (worldBuilding) => {
          const eid = ecsEntityMap.get(worldBuilding.id);
          if (eid === undefined) return;

          const outputItemId = Assembler(worldId).outputItemId[eid];
          const requiredTicks = Assembler(worldId).requiredTicks[eid];

          // Not configured: ensure idle animation
          if (outputItemId === 0) {
            setBuildingAnimation(worldId, worldBuilding.id, false);
            return;
          }

          // Find recipe for configured output item from static data
          const recipes = all_db_items_recipes.filter((r) => r.resultingItem.id === outputItemId);
          if (recipes.length === 0) {
            setBuildingAnimation(worldId, worldBuilding.id, false);
            return;
          }

          // Check all ingredients are available in INPUT slots
          const inputSlots = worldBuilding.world_building_inventory.filter(
            (s) => s.slotType === WorldBuildingInventorySlotType.INPUT,
          );
          const ingredientsAvailable = recipes.every((recipe) => {
            const slot = inputSlots.find((s) => s.itemId === recipe.requiredItem.id);
            return slot && slot.quantity >= recipe.requiredQuantity;
          });

          if (!ingredientsAvailable) {
            Assembler(worldId).progressTicks[eid] = 0;
            setBuildingAnimation(worldId, worldBuilding.id, false);
            return;
          }

          // Increment progress
          Assembler(worldId).progressTicks[eid] += building.processing_ticks;
          setBuildingAnimation(worldId, worldBuilding.id, true);

          // Check if crafting is complete
          if (Assembler(worldId).progressTicks[eid] >= requiredTicks) {
            // Consume ingredients
            for (const recipe of recipes) {
              await addToBuildingInventory({
                transaction,
                inventorySlots: worldBuilding.world_building_inventory,
                itemId: recipe.requiredItem.id,
                quantity: -recipe.requiredQuantity,
                operationType: InventoryOperationType.INPUT_CONSUMPTION,
              });
            }

            // Produce output
            await addToBuildingInventory({
              transaction,
              inventorySlots: worldBuilding.world_building_inventory,
              itemId: outputItemId,
              quantity: 1,
              operationType: InventoryOperationType.PRODUCTION_OUTPUT,
            });

            Assembler(worldId).progressTicks[eid] = 0;
            buildingsNeedingUpdate.push(worldBuilding.id);
          }
        },
        { concurrency: 10 },
      );
    });

    // Only publish update when inventory actually changed (output produced)
    await pMap(buildingsNeedingUpdate, (worldBuildingId) => publishWorldBuildingUpdate(worldBuildingId));
  }
}

export const buildingProcessingQueue = new BuildingProcessingQueue();
