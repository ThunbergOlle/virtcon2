import { RedisPlayer, RedisWorldBuilding, asRedisItem } from '@shared';
import { RedisClientType } from 'redis';

const addBuilding = (building: RedisWorldBuilding, worldId: string, redisClient: RedisClientType) =>
  redisClient.json.arrAppend('worlds', `$.${worldId}.buildings`, building as never);

const getBuildings = async (worldId: string, redisClient: RedisClientType) => {
  const buildings = (await redisClient.json.get('worlds', {
    path: `$.${worldId}.buildings`,
  })) as unknown as RedisWorldBuilding[];
  return buildings;
};

const getBuilding = async (buildingId: string, redisClient: RedisClientType, worldId?: string): Promise<RedisWorldBuilding | null> => {
  const building = (await redisClient.json.get('worlds', {
    path: `$.${worldId || '*'}.buildings[?(@.id=='${buildingId}')]`,
  })) as unknown as RedisWorldBuilding[];
  if (!building || !building[0]) return null;
  return building[0];
};

const getBuildingsByTypeId = async (buildingId: number, redisClient: RedisClientType, worldId?: string): Promise<RedisWorldBuilding[]> => {
  const buildings = (await redisClient.json.get('worlds', {
    path: `$.${worldId || '*'}.buildings[?(@.building.id==${buildingId})]`,
  })) as unknown as RedisWorldBuilding[];
  return buildings;
};

export default {
  addBuilding,
  getBuildings,
  getBuilding,
  getBuildingsByTypeId,
};
