import { AssemblerWorldBuilding, World, WorldBuilding, WorldHarvestable, WorldResource } from '@virtcon2/database-postgres';
import { In, Not } from 'typeorm';

export const loadWorldFromDb = async (
  worldId: string,
): Promise<{
  worldBuildings: WorldBuilding[];
  world: World;
  worldResources: WorldResource[];
  worldHarvestables: WorldHarvestable[];
  assemblerData: AssemblerWorldBuilding[];
}> => {
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

  const worldHarvestables = await WorldHarvestable.find({
    where: { world: { id: world.id } },
  });

  const assemblerData =
    worldBuildings.length > 0
      ? await AssemblerWorldBuilding.findBy({ worldBuildingId: In(worldBuildings.map((wb) => wb.id)) })
      : [];

  return { worldBuildings, world, worldResources, worldHarvestables, assemblerData };
};
