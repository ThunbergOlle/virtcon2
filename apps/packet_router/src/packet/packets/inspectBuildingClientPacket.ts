import { log, LogApp, LogLevel } from '@shared';
import Redis from '@virtcon2/database-redis';
import { ClientPacketWithSender, enqueuePacket, InspectBuildingClientPacket, PacketType } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';

export default async function inspectBuildingClientPacket(packet: ClientPacketWithSender<InspectBuildingClientPacket>, redis: RedisClientType) {
  await Redis.inspectBuilding({
    worldBuildingId: packet.data.worldBuildingId,
    inspectorSocketId: packet.sender.socket_id,
    redis,
    worldId: packet.world_id,
  });

  const worldBuilding = await Redis.getBuilding(packet.data.worldBuildingId, redis, packet.world_id);
  if (!worldBuilding) {
    log(`World building with id ${packet.data.worldBuildingId} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  return enqueuePacket(redis, packet.world_id, {
    packet_type: PacketType.WORLD_BUILDING,
    target: packet.sender.socket_id,
    sender: packet.sender,
    data: worldBuilding,
  });
}
