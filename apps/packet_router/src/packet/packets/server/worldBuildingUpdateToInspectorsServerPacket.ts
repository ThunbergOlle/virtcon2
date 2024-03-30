import Redis from '@virtcon2/database-redis';
import { enqueuePacket, PacketType } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import { SERVER_SENDER } from '../../utils';
import { RedisWorldBuilding } from '@shared';

type FunctionType = {
  redis: RedisClientType;
  worldId?: string;
} & ({ worldBuilding: RedisWorldBuilding } | { worldBuildingId: number });

export default async function worldBuildingUpdateToInspectorsServerPacket(obj: FunctionType) {
  /* Optimise function to allow passing of redis world */
  const worldBuilding = 'worldBuilding' in obj ? obj.worldBuilding : await Redis.getBuilding(obj.worldBuildingId, obj.redis, obj.worldId);
  const inspectors = worldBuilding.inspectors;

  for (const inspectorSocketId of inspectors) {
    enqueuePacket(obj.redis, obj.worldId, {
      packet_type: PacketType.WORLD_BUILDING,
      target: inspectorSocketId,
      sender: SERVER_SENDER,
      data: worldBuilding,
    });
  }
}

export async function refreshBuildingCacheAndSendUpdate(worldBuildingId: number, worldId: string, redis) {
  const worldBuilding = await Redis.refreshBuildingCache(worldBuildingId, redis);
  if (!worldBuilding) return;
  worldBuildingUpdateToInspectorsServerPacket({ worldBuilding, redis, worldId });
}
