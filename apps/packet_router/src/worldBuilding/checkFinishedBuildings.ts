import { all_db_buildings } from '@virtcon2/static-game-data';
import { RedisClientType } from 'redis';

export default async function checkFinishedBuildings(worldId: string, tick: number, redis: RedisClientType) {
  const processBuildings = all_db_buildings.filter((building) => tick % building.processing_ticks === 0).map((building) => building.id);
  if (processBuildings.length === 0) return;
}
