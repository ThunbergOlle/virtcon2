import { loadWorldFromDb } from './loaders';
import { log, LogApp, LogLevel, plotSize } from '@shared';
import { createWorld, defineQuery, deleteWorld, registerComponents, System, World } from '@virtcon2/bytenetc';
import * as DB from '@virtcon2/database-postgres';
import {
  allComponents,
  createNewBuildingEntity,
  createNewHarvestableEntity,
  createNewResourceEntity,
  createNewWorldBorderTile,
  Harvestable,
  Resource,
  tileSize,
  WorldBorderSide,
} from '@virtcon2/network-world-entities';
import { createTileSystem } from '../systems/tileSystem';
import { createResourceSystem } from '../systems/resourceSystem';
import { createBuildingProcessingSystem } from '../systems/buildingProcessingSystem';
import { SyncEntities, WorldBounds, WorldData } from '../systems/types';
import { AppDataSource, WorldHarvestable, WorldResource } from '@virtcon2/database-postgres';
import { getItemByName, Harvestable as HarvestableData } from '@virtcon2/static-game-data';

const worlds = [];
const systems: { [key: string]: System<SyncEntities>[] } = {};
export const worldData: {
  [key: string]: WorldData;
} = {};

const newEntityWorld = (world: World) => {
  if (worlds.includes(world)) throw new Error(`World with id ${world} already exists`);

  worlds.push(createWorld(world));

  log(`Created new world with id ${world}, registering ${allComponents.length} components`);
  registerComponents(world, allComponents);

  return world;
};

const setupSystems = (world: World, seed: number) => {
  systems[world] = [
    createTileSystem(world, seed),
    /** createResourceSystem(world, seed), */
    createBuildingProcessingSystem(world),
  ];
};

export const doesWorldExist = (world: World) => worlds.includes(world);
export const deleteEntityWorld = (world: World) => {
  const index = worlds.indexOf(world);
  if (index === -1) throw new Error(`World with id ${world} does not exist`);

  worlds.splice(index, 1);
  systems[world] = [];
  deleteWorld(world);
};

export const getWorldBounds = async (worldId: string): Promise<WorldBounds[]> => {
  const bounds: WorldBounds[] = await DB.AppDataSource.manager.query(
    `
SELECT
  x, y
FROM
	world_plot
WHERE
	"worldId" = '${worldId}'`,
  );

  return bounds;
};

export const initialiseWorldBounds = async (world: World, bounds: WorldBounds[]) => {
  for (const bound of bounds) {
    const left = bounds.find((b) => b.y === bound.y && b.x === bound.x - plotSize);
    const right = bounds.find((b) => b.y === bound.y && b.x === bound.x + plotSize);
    const top = bounds.find((b) => b.x === bound.x && b.y === bound.y - plotSize);
    const bottom = bounds.find((b) => b.x === bound.x && b.y === bound.y + plotSize);
    if (!left) {
      createNewWorldBorderTile(world, {
        x: bound.x,
        y: bound.y + tileSize / 2,
        side: WorldBorderSide.LEFT,
      });
    }
    if (!right) {
      createNewWorldBorderTile(world, {
        x: bound.x + tileSize,
        y: bound.y + tileSize / 2,
        side: WorldBorderSide.RIGHT,
      });
    }
    if (!top) {
      createNewWorldBorderTile(world, {
        x: bound.x + tileSize / 2,
        y: bound.y,
        side: WorldBorderSide.TOP,
      });
    }
    if (!bottom) {
      createNewWorldBorderTile(world, {
        x: bound.x + tileSize / 2,
        y: bound.y + tileSize,
        side: WorldBorderSide.BOTTOM,
      });
    }
  }

  worldData[world] = { bounds };
};

export const initializeWorld = async (dbWorldId: string) => {
  const { worldBuildings, worldResources, worldHarvestables, world: dbWorld } = await loadWorldFromDb(dbWorldId);

  const world = newEntityWorld(dbWorldId);

  const bounds = await getWorldBounds(dbWorld.id);
  await initialiseWorldBounds(world, bounds);

  setupSystems(world, dbWorld.seed);

  for (const worldBuilding of worldBuildings) {
    createNewBuildingEntity(world, {
      buildingId: worldBuilding.building.id,
      worldBuildingId: worldBuilding.id,
      x: worldBuilding.x,
      y: worldBuilding.y,
      rotation: worldBuilding.rotation,
    });
  }

  for (const worldResource of worldResources) {
    createNewResourceEntity(world, {
      id: worldResource.id,
      resourceName: worldResource.resourceName,
      pos: {
        x: worldResource.x,
        y: worldResource.y,
      },
      quantity: worldResource.quantity,
    });
  }

  for (const worldHarvestable of worldHarvestables) {
    const harvestableInfo = HarvestableData[worldHarvestable.harvestableName];
    const item = getItemByName(harvestableInfo.item);
    if (!item) {
      log(`Item ${harvestableInfo.item} not found for harvestable ${worldHarvestable.harvestableName}`, LogLevel.WARN, LogApp.SERVER);
      continue;
    }

    createNewHarvestableEntity(world, {
      id: worldHarvestable.id,
      pos: {
        x: worldHarvestable.x,
        y: worldHarvestable.y,
      },
      item,
      age: worldHarvestable.age,
    });
  }
};

export const tickSystems = (world: World): SyncEntities[] => {
  if (!systems[world]) {
    log(`World ${world} not found in entityWorld`, LogLevel.WARN, LogApp.SERVER);
    return [];
  }

  const data: SyncEntities[] = [];
  for (const system of systems[world]) {
    data.push(system({ worldData: worldData[world], sync: [], removeEntities: [] }));
  }

  return data;
};

export const syncWorldState = async (world: World) => {
  log(`Syncing world state for world ${world}`, LogLevel.INFO, LogApp.SERVER);
  const resourceQuery = defineQuery(Resource);
  const resourceEntities = resourceQuery(world);

  const harvestableQuery = defineQuery(Harvestable);
  const harvestableEntities = harvestableQuery(world);

  await AppDataSource.transaction(async (transaction) => {
    // Sync resources
    const dbResources = await transaction.find(WorldResource, {
      where: { world: { id: world } },
      select: ['id', 'quantity'],
    });

    for (let i = 0; i < resourceEntities.length; i++) {
      const resourceEid = resourceEntities[i];
      const resourceId = Resource(world).id[resourceEid];

      const dbResource = dbResources.find((res) => res.id === resourceId);
      if (!dbResource) {
        log(`Resource with id ${resourceId} not found in database for world ${world}`, LogLevel.WARN, LogApp.SERVER);
        continue;
      }

      if (dbResource.quantity !== Resource(world).quantity[resourceEid]) {
        dbResource.quantity = Resource(world).quantity[resourceEid];
        await dbResource.save();
      }
    }

    // Sync harvestables - delete DB records where entity no longer exists in ECS (harvested)
    const dbHarvestables = await transaction.find(WorldHarvestable, {
      where: { world: { id: world } },
      select: ['id'],
    });

    const ecsHarvestableIds = new Set<number>();
    for (let i = 0; i < harvestableEntities.length; i++) {
      ecsHarvestableIds.add(Harvestable(world).id[harvestableEntities[i]]);
    }

    for (const dbHarvestable of dbHarvestables) {
      if (!ecsHarvestableIds.has(dbHarvestable.id)) {
        await transaction.delete(WorldHarvestable, { id: dbHarvestable.id });
        log(`Deleted harvested harvestable ${dbHarvestable.id} from database`, LogLevel.INFO, LogApp.SERVER);
      }
    }
  });
};
