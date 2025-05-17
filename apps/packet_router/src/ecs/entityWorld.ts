import { loadWorldFromDb } from './loaders';
import { log, LogApp, LogLevel } from '@shared';
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
import { SyncEntities } from '../systems/types';

const worlds = [];
const systems: { [key: string]: System<SyncEntities>[] } = {};
export const worldData: {
  [key: string]: {
    bounds: {
      startX: number;
      endX: number;
      startY: number;
      endY: number;
    };
  };
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

export type WorldBounds = {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
};
export const getWorldBounds = async (worldId: string): Promise<WorldBounds> => {
  const bounds: WorldBounds = await DB.AppDataSource.manager
    .query(
      `
SELECT
 MIN ( "startX" ) AS "startX",
 MAX ( "endX" ) AS "endX",
 MIN ( "startY" ) AS "startY",
 MAX ( "endY" ) AS "endY"
FROM
	world_plot
WHERE
	"worldId" = '${worldId}'`,
    )
    .then((row) => row[0]);

  return bounds;
};

const initialiseWorldBounds = async (world: World, bounds: WorldBounds) => {
  for (let i = bounds.startX; i < bounds.endX; i += tileSize + 1) {
    createNewWorldBorderTile(world, {
      x: i - 0.5 + tileSize / 2,
      y: -1.5,
      side: WorldBorderSide.TOP,
    });
  }

  for (let i = bounds.startY; i < bounds.endY; i += tileSize + 1) {
    createNewWorldBorderTile(world, {
      x: -1.5,
      y: i - 0.5 + tileSize / 2,
      side: WorldBorderSide.LEFT,
    });
  }

  for (let i = bounds.startX; i < bounds.endX; i += tileSize + 1) {
    createNewWorldBorderTile(world, {
      x: i - 0.5 + tileSize / 2,
      y: bounds.endY + 0.5,
      side: WorldBorderSide.BOTTOM,
    });
  }

  for (let i = bounds.startY; i < bounds.endY; i += tileSize + 1) {
    createNewWorldBorderTile(world, {
      x: bounds.endX + 0.5,
      y: i - 0.5 + tileSize / 2,
      side: WorldBorderSide.RIGHT,
    });
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
    data.push(system({ sync: [], removeEntities: [] }));
  }

  return data;
};
