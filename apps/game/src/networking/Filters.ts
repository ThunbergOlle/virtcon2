import { PacketType, ServerPacket } from '@virtcon2/network-packet';

export function filterPacket<T>(packets: ServerPacket<unknown>[], packetType: PacketType): ServerPacket<T>[] {
  return packets.filter((packet) => packet.packet_type === packetType) as ServerPacket<T>[];
}
