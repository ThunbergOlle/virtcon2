import { NetworkPacketData, PacketType } from '../../types/packet';

export function DeconstructRedisPacket<T>(packet_data: string, world_id: string): NetworkPacketData<T> {
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
