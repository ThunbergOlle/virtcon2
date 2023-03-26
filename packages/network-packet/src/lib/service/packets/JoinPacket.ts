import { ServerPlayer } from '@shared';
import { NetworkPacket, PacketType } from '../../types/packet';
import { generatePayload, parsePayload } from './PacketService';

export interface JoinPacketData {

  player: ServerPlayer
}
export class JoinPacket extends NetworkPacket{
  constructor() {
    super(PacketType.JOIN);
  }

  serialize(data: JoinPacketData): string {
    const packetData = [this.type, data.player.id, data.player.name, data.player.pos.x, data.player.pos.y];
    return generatePayload(packetData)
  }
  deserialize(data: string): JoinPacketData {
    console.log(data);
    const packetData = parsePayload(data);
    return {
      player: {
        id: packetData[1],
        name: packetData[2],
        pos: {
          x: Number(packetData[3]),
          y: Number(packetData[4]),
          updated: 0
        }
      }
    } as JoinPacketData;
  }
}
