import { pMap } from '@shared';
import { World } from '@virtcon2/bytenetc';
import {
  addToInventory,
  AppDataSource,
  publishWorldBuildingUpdate,
  safelyMoveItemsBetweenInventories,
  WorldBuilding,
} from '@virtcon2/database-postgres';
import { all_db_buildings, DBBuilding } from '@virtcon2/static-game-data';
import { EntityManager, IsNull, Not } from 'typeorm';

export default async function checkFinishedBuildings(world: World, tick: number) {
  const processBuildings = all_db_buildings.filter((building) => tick % building.processing_ticks === 0);
  if (processBuildings.length === 0) return;

  await AppDataSource.manager.transaction(async (transaction) =>
    pMap(processBuildings, (building) => processBuilding(transaction, world, building), { concurrency: 10 }),
  );
  await processInventories(world);
}

async function processBuilding(transaction: EntityManager, world: World, building: DBBuilding) {
  if (!building.processing_requirements.length && (building.output_item || building.items_to_be_placed_on.length))
    return processResourceExtractingBuilding(transaction, world, building);
  if (building.processing_requirements.length) return processBuildingWithRequirements(transaction, world, building);
}

async function processResourceExtractingBuilding(transaction: EntityManager, world: World, building: DBBuilding) {
  const worldBuildings = await WorldBuilding.find({
    where: { building: { id: building.id }, world: { id: world } },
    relations: ['world_building_inventory'],
  });

  await pMap(
    worldBuildings,
    async (worldBuilding) => {
      if (building.output_item?.id)
        return addToInventory(transaction, worldBuilding.world_building_inventory, building.output_item.id, building.output_quantity);
      else console.log('TODO: Implement this');
    },
    { concurrency: 10 },
  );

  return pMap(worldBuildings, (worldBuilding) => publishWorldBuildingUpdate(worldBuilding.id));
}

async function processBuildingWithRequirements(transaction: EntityManager, world: World, building: DBBuilding) {
  const worldBuildings = await WorldBuilding.find({
    where: { building: { id: building.id }, world: { id: world } },
    relations: ['world_building_inventory'],
  });

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

  return pMap(worldBuildings, (worldBuilding) => publishWorldBuildingUpdate(worldBuilding.id));
}

async function processInventories(world: World) {
  const worldBuildings = await WorldBuilding.find({
    where: { world: { id: world }, output_world_building: Not(IsNull()) },
    /* TODO: we need to improve the performance of this */
    relations: [
      'building',
      'world_building_inventory',
      'output_world_building',
      'output_world_building.world_building_inventory',
      'output_world_building.world_building_inventory.item',
    ],
  });

  for (let i = 0; i < worldBuildings.length; i++) {
    const worldBuilding = worldBuildings[i];
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
