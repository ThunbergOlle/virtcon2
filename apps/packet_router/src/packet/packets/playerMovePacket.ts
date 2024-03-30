import { log, LogApp, LogLevel } from '@shared';
import Redis from '@virtcon2/database-redis';
import { ClientPacketWithSender, enqueuePacket, PacketType, PlayerSetPositionServerPaacket } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';

export default async function playerMovePacket(packet: ClientPacketWithSender<PlayerSetPositionServerPaacket>, client: RedisClientType) {
  log(`Player ${packet.sender?.id} moved to ${packet.data.position}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
  await Redis.updatePlayer({
    worldId: packet.world_id,
    playerId: packet.sender.id,
    attributes: {
      position: packet.data.position,
    },
    redisClient: client,
  });

  await enqueuePacket<PlayerSetPositionServerPaacket>(client, packet.world_id, {
    packet_type: PacketType.PLAYER_SET_POSITION,
    target: packet.world_id,
    sender: packet.sender,
    data: { position: packet.data.position, player_id: packet.sender.id },
  });
}
