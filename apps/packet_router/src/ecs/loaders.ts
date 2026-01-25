import { World, WorldBuilding, WorldResource } from '@virtcon2/database-postgres';
import { Not } from 'typeorm';

export const loadWorldFromDb = async (
  worldId: string,
): Promise<{ worldBuildings: WorldBuilding[]; world: World; worldResources: WorldResource[] }> => {
  const world = await World.findOne({ where: { id: worldId } });
  if (!world) {
    throw new Error(`World ${worldId} does not exist.`);
  }
  /* Uncomment this when debugging procedural world generation */
  const worldBuildings = await WorldBuilding.find({
    where: { world: { id: world.id } },
    relations: ['building'],
  });

  const worldResources = await WorldResource.find({
    where: { world: { id: world.id }, worldBuilding: null, quantity: Not(0) },
  });

  return { worldBuildings, world, worldResources };
};
