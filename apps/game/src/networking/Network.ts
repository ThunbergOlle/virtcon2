import { Socket, io } from 'socket.io-client';
import { events } from '../events/Events';
import Game from '../scenes/Game';

import { ServerPacket, PacketType, RequestJoinPacketData, ClientPacket } from '@virtcon2/network-packet';

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

    socket.on('packet', (packet: ServerPacket<unknown>) => {
      const event = packet.packet_type.charAt(0).toUpperCase() + packet.packet_type.slice(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events.notify(('network' + event) as any, packet.data);

      this.received_packets.push(packet);
      //events.notify(('network' + event) as any, packetJSON.data);
    });
  }

  public getReceivedPackets() {
    return [this.received_packets, this.received_packets.length] as const;
  }

  public readReceivedPackets(length: number) {
    console.log(`Reading ${length} packets`);
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
