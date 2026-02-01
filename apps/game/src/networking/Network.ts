import { Socket, io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { events } from '../events/Events';
import Game from '../scenes/Game';

import { ServerPacket, PacketType, RequestJoinPacketData, ClientPacket, PickupBuildingErrorPacketData } from '@virtcon2/network-packet';
import { ErrorType } from '@shared';

export class Network {
  socket: Socket;
  isConnected: boolean = false;

  private received_packets: ServerPacket<unknown>[] = [];

  constructor() {
    const socket = io('ws://localhost:4000', {
      extraHeaders: {
        Authorization: localStorage.getItem('token') || '',
      },
    });
    this.socket = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    socket.on('packets', (packets: ServerPacket<unknown>[]) => {
      this.received_packets.push(...packets);

      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];

        const event = packet.packet_type.charAt(0).toUpperCase() + packet.packet_type.slice(1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        events.notify(('network' + event) as any, packet.data);
      }
    });

    socket.on('error', (error: string) => {
      console.error('Error from server:', error);
      events.notify('networkError', { message: error, type: ErrorType.NetworkError });
    });
  }

  public getReceivedPackets() {
    return [this.received_packets, this.received_packets.length] as const;
  }

  public readReceivedPacketType(packetType: PacketType) {
    const packets = this.received_packets.filter((packet) => packet.packet_type === packetType);
    console.log('Packets:', packets);
    this.received_packets = this.received_packets.filter((packet) => packet.packet_type !== packetType);
    return packets;
  }

  public readReceivedPackets(length: number) {
    return this.received_packets.splice(0, length);
  }

  join(worldId: string) {
    Game.worldId = worldId;
    const token = localStorage.getItem('token');
    const packet: ClientPacket<RequestJoinPacketData> = {
      data: { socket_id: '', token: token || '' },
      packet_type: PacketType.REQUEST_JOIN,
      world_id: Game.worldId,
    };
    this.sendPacket(packet);
  }
  disconnect() {
    console.log('Disconnecting from server');
    this.socket.disconnect();
  }
  sendPacket(packet: ClientPacket<unknown>) {
    packet.world_id = Game.worldId;
    if (!packet.packet_type || !packet.world_id) {
      console.log('Invalid packet');
      return;
    }

    this.socket.emit('packet', packet);
  }
}
