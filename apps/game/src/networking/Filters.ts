import { NetworkPacketData, PacketType } from '@virtcon2/network-packet';

export function filterPacket<T>(packets: NetworkPacketData<unknown>[], packetType: PacketType): NetworkPacketData<T>[] {
  return packets.filter((packet) => packet.packet_type === packetType) as NetworkPacketData<T>[];
}
