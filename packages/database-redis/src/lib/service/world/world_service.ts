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
    relations: [
      'building',
      'building.items_to_be_placed_on',
      'building.item',
      'world_building_inventory',
      'world_building_inventory.item',
      'world_resource',
      'output_world_building',
    ],
  });

  const redisWorldBuildings = buildings.map(
    (building): RedisWorldBuilding => ({
      active: building.active,
      building: building.building,
      id: building.id,
      x: building.x,
      y: building.y,
      output_pos_x: building.output_pos_x,
      output_pos_y: building.output_pos_y,
      world_building_inventory: building.world_building_inventory,
      output_world_building: building.output_world_building,
      world_resource: building.world_resource,
      rotation: building.rotation,
      inspectors: [],
    }),
  );

  const redisWorld: RedisWorld = {
    id: world.id,
    players: [],
    buildings: redisWorldBuildings,
    resources: world.resources as unknown as Array<RedisWorldResource>,
    height_map: PostgresWorldEntity.Get2DWorldMap(world.seed),
  };

  return redisWorld;
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
