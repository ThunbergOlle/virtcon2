import { log, LogApp, LogLevel, RedisWorldBuilding } from '@shared';
import { WorldBuilding } from '@virtcon2/database-postgres';
import { RedisClientType } from 'redis';

const addBuilding = (building: RedisWorldBuilding, worldId: string, redisClient: RedisClientType) =>
  redisClient.json.arrAppend('worlds', `$.${worldId}.buildings`, building as never);

const getBuildings = async (worldId: string, redisClient: RedisClientType) => {
  const buildings = (await redisClient.json.get('worlds', {
    path: `$.${worldId}.buildings`,
  })) as unknown as RedisWorldBuilding[];
  return buildings;
};

const getBuilding = async (worldBuildingId: number, redisClient: RedisClientType, worldId?: string): Promise<RedisWorldBuilding | null> => {
  const building = (await redisClient.json.get('worlds', {
    path: `$.${worldId || '*'}.buildings[?(@.id==${worldBuildingId})]`,
  })) as unknown as RedisWorldBuilding[];
  if (!building || !building[0]) return null;
  return building[0];
};

const updateBuilding = async (building: Partial<RedisWorldBuilding>, worldId: string, redisClient: RedisClientType) => {
  if (!building.id) {
    log('Building id is required to update building', LogLevel.ERROR, LogApp.DATABASE_REDIS);
    return null;
  }
  const currentBuilding = await getBuilding(building.id, redisClient, worldId);

  if (!currentBuilding) {
    log(`Building with id ${building.id} not found`, LogLevel.ERROR, LogApp.DATABASE_REDIS);
    return null;
  }

  const updatedBuilding: RedisWorldBuilding = { ...currentBuilding, ...building };
  await redisClient.json.set('worlds', `$.${worldId}.buildings[?(@.id==${building.id})]`, updatedBuilding as never);
  return updatedBuilding;
};

const getBuildingsByTypeId = async (buildingId: number, redisClient: RedisClientType, worldId?: string): Promise<RedisWorldBuilding[]> => {
  const buildings = (await redisClient.json.get('worlds', {
    path: `$.${worldId || '*'}.buildings[?(@.building.id==${buildingId})]`,
  })) as unknown as RedisWorldBuilding[];
  return buildings;
};

const inspectBuilding = async ({
  worldBuildingId,
  inspectorSocketId,
  redis,
  worldId,
}: {
  worldBuildingId: number;
  inspectorSocketId: string;
  redis: RedisClientType;
  worldId?: string;
}) => {
  const building = await getBuilding(worldBuildingId, redis, worldId);
  if (!building) return;
  building.inspectors.push(inspectorSocketId);
  await redis.json.set('worlds', `$.${worldId || '*'}.buildings[?(@.id==${worldBuildingId})].inspectors`, building.inspectors);
};

const doneInspectingBuilding = async (buildingId: number, inspectorSocketId: string, redisClient: RedisClientType, worldId?: string) => {
  const building = await getBuilding(buildingId, redisClient, worldId);
  if (!building) return;
  building.inspectors = building.inspectors.filter((inspector) => inspector !== inspectorSocketId);
  await redisClient.json.set('worlds', `$.${worldId || '*'}.buildings[?(@.id==${buildingId})].inspectors`, building.inspectors);
};

const refreshBuildingCache = async (worldBuildingId: number, redisClient: RedisClientType, newBuilding = false) => {
  const building = await WorldBuilding.findOne({
    where: { id: worldBuildingId },
    relations: ['building', 'world_building_inventory', 'output_world_building', 'world_building_inventory.item', 'world'],
  });
  if (!building) throw new Error(`Building with id ${worldBuildingId} not found`);

  const worldBuilding = {
    active: building.active,
    building: building.building,
    id: building.id,
    x: building.x,
    y: building.y,
    rotation: building.rotation,
    world_resource: building.world_resource,
    world_building_inventory: building.world_building_inventory,
    output_pos_x: building.output_pos_x,
    output_pos_y: building.output_pos_y,
  };

  if (newBuilding) {
    const newBuilding: RedisWorldBuilding = {
      ...worldBuilding,
      id: worldBuilding.id,
      inspectors: [],
    };
    await addBuilding(newBuilding, building.world.id, redisClient);
    return newBuilding;
  }

  return updateBuilding(worldBuilding, building.world.id, redisClient);
};

export default {
  addBuilding,
  getBuildings,
  getBuilding,
  getBuildingsByTypeId,
  inspectBuilding,
  doneInspectingBuilding,
  updateBuilding,
  refreshBuildingCache,
};
