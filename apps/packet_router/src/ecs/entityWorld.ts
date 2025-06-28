import { loadWorldFromDb } from './loaders';
import { log, LogApp, LogLevel, plotSize } from '@shared';
import { createWorld, deleteWorld, registerComponents, System, World } from '@virtcon2/bytenetc';
import * as DB from '@virtcon2/database-postgres';
import {
  allComponents,
  createNewBuildingEntity,
  createNewWorldBorderTile,
  tileSize,
  WorldBorderSide,
} from '@virtcon2/network-world-entities';
import { createTileSystem } from '../systems/tileSystem';
import { createResourceSystem } from '../systems/resourceSystem';
import { SyncEntities, WorldBounds, WorldData } from '../systems/types';

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
  systems[world] = [createTileSystem(world, seed), createResourceSystem(world, seed)];
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

const initialiseWorldBounds = async (world: World, bounds: WorldBounds[]) => {
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
};

export const initializeWorld = async (dbWorldId: string) => {
  const { worldBuildings, world: dbWorld } = await loadWorldFromDb(dbWorldId);

  const world = newEntityWorld(dbWorldId);

  const bounds = await getWorldBounds(dbWorld.id);
  await initialiseWorldBounds(world, bounds);
  worldData[world] = { bounds };

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
