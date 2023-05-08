import { NetworkPacketData, PacketType } from '../../types/packet';
import { RedisPacketPublisher } from './RedisPacketPublisher';

export function DeconstructRedisPacket<T>(packet_data: string, channel: string): NetworkPacketData<T> {
  // get world_id from channel
  const packet_prefix = RedisPacketPublisher.channel_prefix;
  const world_id = channel.slice(packet_prefix.length);

  const packet_parts = packet_data.split('#');
  const packet_type = packet_parts[0] as PacketType;
  const packet_target = packet_parts[1];
  const data: T = JSON.parse(packet_parts[2]);
  return {
    world_id,
    packet_type,
    packet_target,
    data,
  };
}
