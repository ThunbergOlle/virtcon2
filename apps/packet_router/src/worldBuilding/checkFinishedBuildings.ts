import Redis from '@virtcon2/database-redis';
import { all_db_buildings } from '@virtcon2/static-game-data';
import { RedisClientType } from 'redis';
import finishProcessing from './process';
import { log, LogLevel } from '@shared';

export default async function checkFinishedBuildings(worldId: string, tick: number, redis: RedisClientType) {
  const processBuildings = all_db_buildings.filter((building) => tick % building.processing_ticks === 0).map((building) => building.id);
  if (processBuildings.length === 0) return;
  log(`Begin processing buildings: ${processBuildings.join(', ')}`, LogLevel.INFO);

  for (const buildingId of processBuildings) {
    const buildings = await Redis.getBuildingsByTypeId(buildingId, redis, worldId);
    for (const building of buildings) {
      await finishProcessing(building.id, redis);
      log(`Building ${building.id} finished processing`, LogLevel.INFO);
    }
  }
}
