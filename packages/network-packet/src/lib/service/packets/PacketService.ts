import { NetworkPacket, PacketType } from '../../types/packet';
import { JoinPacket } from './JoinPacket';

export function getPacket(type: PacketType): NetworkPacket {
  switch (type) {
    case PacketType.JOIN:
      return new JoinPacket();
    default:
      throw new Error('Invalid packet type');
  }
}

export function generatePayload(packetData: Array<string | number>): string {
  return packetData.join('#');
}
export function parsePayload(payload: string): Array<string | number> {
  return payload.split('#');
}
export function extractWorldId(payload: string): string {
  return payload.split('_')[0];
}
export function getPacketData(payload: string): string {
  return payload.split('_')[1];
}
