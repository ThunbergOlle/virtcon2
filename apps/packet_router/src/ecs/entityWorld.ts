import { loadWorldFromDb } from './loaders';
import { log } from '@shared';
import { createWorld, deleteWorld, registerComponents, World } from '@virtcon2/bytenetc';
import { allComponents, createNewBuildingEntity, createNewResourceEntity } from '@virtcon2/network-world-entities';
import { getResourceNameFromItemName } from '@virtcon2/static-game-data';

const worlds = [];

export const newEntityWorld = (world: World) => {
  if (worlds.includes(world)) throw new Error(`World with id ${world} already exists`);

  worlds.push(createWorld(world));

  log(`Created new world with id ${world}, registering ${allComponents.length} components`);
  registerComponents(world, allComponents);

  return world;
};

export const doesWorldExist = (world: World) => worlds.includes(world);
export const deleteEntityWorld = (world: World) => {
  const index = worlds.indexOf(world);
  if (index === -1) throw new Error(`World with id ${world} does not exist`);

  worlds.splice(index, 1);
  deleteWorld(world);
};

export const loadEntitiesIntoMemory = async (dbWorldId: string) => {
  const { resources, worldBuildings } = await loadWorldFromDb(dbWorldId);
  const world = newEntityWorld(dbWorldId);

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
