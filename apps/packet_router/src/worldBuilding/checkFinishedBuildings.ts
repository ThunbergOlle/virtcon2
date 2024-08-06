import { World } from '@virtcon2/bytenetc';
import { addToInventory, safelyMoveItemsBetweenInventories, WorldBuilding } from '@virtcon2/database-postgres';
import { all_db_buildings, DBBuilding } from '@virtcon2/static-game-data';
import { IsNull, Not } from 'typeorm';

export default async function checkFinishedBuildings(world: World, tick: number) {
  const processBuildings = all_db_buildings.filter((building) => tick % building.processing_ticks === 0);
  if (processBuildings.length === 0) return;

  for (const buildingId of processBuildings) {
    await processBuilding(world, buildingId);
  }
  processInventories(world);
}

async function processBuilding(world: World, building: DBBuilding) {
  if (!building.processing_requirements.length && building.output_item) return processResourceExtractingBuilding(world, building);
  if (building.processing_requirements.length) return processBuildingWithRequirements(world, building);
}

async function processResourceExtractingBuilding(world: World, building: DBBuilding) {
  const worldBuildings = await WorldBuilding.find({
    where: { building: { id: building.id }, world: { id: world } },
    relations: ['world_building_inventory'],
  });

  for (const worldBuilding of worldBuildings) {
    await addToInventory(worldBuilding.world_building_inventory, building.output_item.id, building.output_quantity);
  }
}

async function processBuildingWithRequirements(world: World, building: DBBuilding) {
  const worldBuildings = await WorldBuilding.find({
    where: { building: { id: building.id }, world: { id: world } },
    relations: ['world_building_inventory'],
  });

  for (const worldBuilding of worldBuildings) {
    const requirementsMet = building.processing_requirements.every((req) => {
      const inventory = worldBuilding.world_building_inventory.find((inv) => inv.itemId === req.item.id);
      return inventory && inventory.quantity >= req.quantity;
    });

    if (!requirementsMet) continue;

    for (const requirement of building.processing_requirements) {
      await addToInventory(worldBuilding.world_building_inventory, requirement.item.id, -requirement.quantity);
    }

    await addToInventory(worldBuilding.world_building_inventory, building.output_item.id, building.output_quantity);
  }
}

async function processInventories(world: World) {
  const worldBuildings = await WorldBuilding.find({
    where: { world: { id: world }, output_world_building: Not(IsNull()) },

    relations: ['output_world_building', 'output_world_building.world_building_inventory', 'output_world_building.world_building_inventory.item'],
  });

  for (const worldBuilding of worldBuildings) {
    const itemsToMove = worldBuilding.world_building_inventory.find((inv) => inv.itemId);
    if (!itemsToMove) continue;

    await safelyMoveItemsBetweenInventories({
      fromId: worldBuilding.id,
      toId: worldBuilding.output_world_building.id,
      itemId: itemsToMove.item.id,
      quantity: Math.min(itemsToMove.quantity, worldBuilding.building.inventory_transfer_quantity_per_cycle),
      fromType: 'building',
      toType: 'building',
    });
  }
}
