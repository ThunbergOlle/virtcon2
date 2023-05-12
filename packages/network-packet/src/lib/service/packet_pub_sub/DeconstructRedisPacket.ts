import { ServerPlayer } from '@shared';
import { NetworkPacketDataWithSender, PacketType } from '../../types/packet';
import { RedisPacketPublisher } from './RedisPacketPublisher';

export function DeconstructRedisPacket<T>(packet_data: string, channel: string): NetworkPacketDataWithSender<T> {
  // get world_id from channel
  const packet_prefix = RedisPacketPublisher.channel_prefix;
  const world_id = channel.slice(packet_prefix.length);

  const packet_parts = packet_data.split('#');
  const packet_type = packet_parts[0] as PacketType;
  const packet_target = packet_parts[1];
  const packet_sender = JSON.parse(packet_parts[2]) as ServerPlayer;
  const data: T = JSON.parse(packet_parts[3]);
  return {
    world_id,
    packet_type,
    packet_target,
    packet_sender,
    data,
  };
}
