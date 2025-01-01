import { loadWorldFromDb } from './loaders';
import { log, LogApp, LogLevel } from '@shared';
import { createWorld, deleteWorld, registerComponents, System, World } from '@virtcon2/bytenetc';
import { allComponents, createNewBuildingEntity, createNewResourceEntity } from '@virtcon2/network-world-entities';
import { getResourceNameFromItemName } from '@virtcon2/static-game-data';
import { createTileSystem } from '../systems/tileSystem';

const worlds = [];
const systems: { [key: string]: System<void>[] } = {};

const newEntityWorld = (world: World) => {
  if (worlds.includes(world)) throw new Error(`World with id ${world} already exists`);

  worlds.push(createWorld(world));

  log(`Created new world with id ${world}, registering ${allComponents.length} components`);
  registerComponents(world, allComponents);

  return world;
};

const setupSystems = (world: World, seed: number) => {
  systems[world] = [];
  systems[world].push(createTileSystem(world, seed));
};

export const doesWorldExist = (world: World) => worlds.includes(world);
export const deleteEntityWorld = (world: World) => {
  const index = worlds.indexOf(world);
  if (index === -1) throw new Error(`World with id ${world} does not exist`);

  worlds.splice(index, 1);
  systems[world] = [];
  deleteWorld(world);
};

export const initializeWorld = async (dbWorldId: string) => {
  const { resources, worldBuildings, world: dbWorld } = await loadWorldFromDb(dbWorldId);

  const world = newEntityWorld(dbWorldId);
  setupSystems(world, dbWorld.seed);

  for (const worldBuilding of worldBuildings) {
    createNewBuildingEntity(world, {
      buildingId: worldBuilding.building.id,
      worldBuildingId: worldBuilding.id,
      x: worldBuilding.x,
      y: worldBuilding.y,
      rotation: worldBuilding.rotation,
      outputX: worldBuilding.output_pos_x,
      outputY: worldBuilding.output_pos_y,
    });
  }

  for (const resource of resources) {
    const resourceName = getResourceNameFromItemName(resource.item.name);
    if (!resourceName) throw new Error(`Resource ${resource.item.name} does not exist`);

    createNewResourceEntity(world, {
      resourceName,
      pos: {
        x: resource.x,
        y: resource.y,
      },
      resourceId: resource.id,
      itemId: resource.item.id,
      worldBuildingId: resource.worldBuildingId,
    });
  }
};

export const tickSystems = (world: World) => {
  if (!systems[world]) return log(`World ${world} not found in entityWorld`, LogLevel.WARN, LogApp.SERVER);
  for (const system of systems[world]) {
    system();
  }
};
