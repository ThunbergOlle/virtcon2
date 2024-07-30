import { createWorld, defineSerializer, IWorld, registerComponents } from 'bitecs';
import { loadWorldFromDb } from './loaders';

import { log } from '@shared';
import { allComponents, createNewBuildingEntity, createNewResourceEntity } from '@virtcon2/network-world-entities';
import { getResourceNameFromItemName } from '@virtcon2/static-game-data';

export const worlds: { [key: string]: IWorld } = {};

export const newEntityWorld = (id: string) => {
  if (worlds[id]) throw new Error(`World with id ${id} already exists`);
  worlds[id] = createWorld();
  log(`Created new world with id ${id}, registering ${allComponents.length} components`);
  registerComponents(worlds[id], allComponents);
  return worlds[id];
};

export const getEntityWorld = (id: string) => {
  return worlds[id];
};

export const deleteEntityWorld = (id: string) => {
  delete worlds[id];
};

export const loadEntitiesIntoMemory = async (dbWorldId: string) => {
  const { resources, worldBuildings } = await loadWorldFromDb(dbWorldId);

  for (const worldBuilding of worldBuildings) {
    createNewBuildingEntity({
      buildingId: worldBuilding.building.id,
      worldBuildingId: worldBuilding.id,
      x: worldBuilding.x,
      y: worldBuilding.y,
      rotation: worldBuilding.rotation,
    });
  }

  for (const resource of resources) {
    const resourceName = getResourceNameFromItemName(resource.item.name);
    if (!resourceName) throw new Error(`Resource ${resource.item.name} does not exist`);

    createNewResourceEntity({
      resourceName,
      pos: {
        x: resource.x,
        y: resource.y,
      },
      resourceId: resource.id,
      itemId: resource.item.id,
    });
  }
};

export const serializeEntityWorld = (worldId: string) => {
  const entityWorld = getEntityWorld(worldId);
  const serialize = defineSerializer(entityWorld);
  return serialize(entityWorld);
};
