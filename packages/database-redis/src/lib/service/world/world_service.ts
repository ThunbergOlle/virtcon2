import { RedisWorld, RedisWorldBuilding, RedisWorldResource } from '@shared';
import { World as PostgresWorldEntity, WorldBuilding } from '@virtcon2/database-postgres';
import { RedisClientType } from 'redis';
import { World as WorldUtils } from './world_utils';

const openWorld = async (worldId: string, redis: RedisClientType) => {
  const new_world = await loadWorld(worldId);
  await WorldUtils.registerWorld(new_world, redis);
};

const loadWorld = async (world_id: string): Promise<RedisWorld> => {
  const world = await PostgresWorldEntity.findOne({ where: { id: world_id }, relations: ['resources', 'resources.item'] });
  if (!world) {
    throw new Error(`World ${world_id} does not exist.`);
  }
  /* Uncomment this when debugging procedural world generation */
  // await PostgresWorldEntity.RegenerateWorld(world.id)
  const buildings = await WorldBuilding.find({
    where: { world: { id: world.id } },
    relations: ['building', 'building.items_to_be_placed_on', 'building.item'],
  });
  return {
    id: world.id,
    players: [],
    buildings: buildings as unknown as Array<RedisWorldBuilding>,
    resources: world.resources as unknown as Array<RedisWorldResource>,
    height_map: PostgresWorldEntity.Get2DWorldMap(world.seed),
  } as RedisWorld;
};

const clearWorlds = (redis: RedisClientType) => redis.json.set('worlds', '$', {});

const getWorld = async (world_id: string, redis: RedisClientType): Promise<RedisWorld> => {
  const world = await WorldUtils.getWorld(world_id, redis);
  if (!world) {
    throw new Error(`World ${world_id} does not exist.`);
  }
  return world;
};

export default {
  openWorld,
  loadWorld,
  clearWorlds,
  getWorld,
};
