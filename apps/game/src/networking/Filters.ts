import { ClientPacket, PacketType } from '@virtcon2/network-packet';

export function filterPacket<T>(packets: ClientPacket<unknown>[], packetType: PacketType): ClientPacket<T>[] {
  return packets.filter((packet) => packet.packet_type === packetType) as ClientPacket<T>[];
}
