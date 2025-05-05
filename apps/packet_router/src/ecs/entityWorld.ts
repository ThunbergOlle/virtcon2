import { loadWorldFromDb } from './loaders';
import { log, LogApp, LogLevel } from '@shared';
import { createWorld, deleteWorld, registerComponents, System, World } from '@virtcon2/bytenetc';
import * as DB from '@virtcon2/database-postgres';
import {
  allComponents,
  createNewBuildingEntity,
  createNewWorldBorderTile,
  WorldBorder,
  WorldBorderSide,
} from '@virtcon2/network-world-entities';
import { createTileSystem } from '../systems/tileSystem';
import { createResourceSystem } from '../systems/resourceSystem';

const worlds = [];
const systems: { [key: string]: System<void>[] } = {};
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
  for (let i = bounds.startX; i <= bounds.endX; i++) createNewWorldBorderTile(world, { x: i, y: bounds.startY, side: WorldBorderSide.TOP });
  for (let i = bounds.startY; i <= bounds.endY; i++)
    createNewWorldBorderTile(world, { x: bounds.startX, y: i, side: WorldBorderSide.LEFT });
  for (let i = bounds.startX; i <= bounds.endX; i++)
    createNewWorldBorderTile(world, { x: i, y: bounds.endY, side: WorldBorderSide.BOTTOM });
  for (let i = bounds.startY; i <= bounds.endY; i++) createNewWorldBorderTile(world, { x: bounds.endX, y: i, side: WorldBorderSide.RIGHT });
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

export const tickSystems = (world: World) => {
  if (!systems[world]) return log(`World ${world} not found in entityWorld`, LogLevel.WARN, LogApp.SERVER);
  for (const system of systems[world]) {
    system();
  }
};
