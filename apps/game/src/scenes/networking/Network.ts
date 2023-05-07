import { ServerLobby } from '@shared';

import { Socket, io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { events } from '../../events/Events';
import Game from '../Game';

import { JoinPacketData, NetworkPacketData, PacketType, RequestJoinPacketData } from '@virtcon2/network-packet';

export class Network {
  socket: Socket;
  isConnected: boolean = false;
  lobbies: ServerLobby[] = [];

  constructor() {
    const socket = io('ws://localhost:4000');
    this.socket = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    socket.on('packet', (packetJSON: NetworkPacketData<unknown>) => {
      const event = packetJSON.packet_type.charAt(0).toUpperCase() + packetJSON.packet_type.slice(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events.notify(('network' + event) as any, packetJSON.data);
    });
  }

  join(worldId: string) {
    Game.worldId = worldId;
    const token = localStorage.getItem('token');
    const packet: NetworkPacketData<RequestJoinPacketData> = { data: { socket_id: '', token: token || '' }, packet_type: PacketType.REQUEST_JOIN, world_id: Game.worldId };
    this.sendPacket(packet);
  }
  disconnect() {
    console.log('Disconnecting from server');
    this.socket.disconnect();
  }
  sendPacket(packet: NetworkPacketData<unknown>) {
    if (!packet.world_id || !packet.packet_type) return;
    this.socket.emit('packet', JSON.stringify(packet));
  }
}
