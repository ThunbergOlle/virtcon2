import { World, WorldBuilding } from '@virtcon2/database-postgres';

export const loadWorldFromDb = async (worldId: string): Promise<{ worldBuildings: WorldBuilding[]; world: World }> => {
  const world = await World.findOne({ where: { id: worldId } });
  if (!world) {
    throw new Error(`World ${worldId} does not exist.`);
  }
  /* Uncomment this when debugging procedural world generation */
  // await PostgresWorldEntity.RegenerateWorld(world.id)
  const worldBuildings = await WorldBuilding.find({
    where: { world: { id: world.id } },
    relations: ['building'],
  });

  return { worldBuildings, world };
};
