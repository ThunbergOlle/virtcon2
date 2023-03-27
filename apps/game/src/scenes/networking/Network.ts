import { ServerLobby, ServerPlayer } from '@shared';

import { Socket, io } from 'socket.io-client';
import { events } from '../../events/Events';
import Game from '../Game';
import { v4 as uuidv4 } from 'uuid';

import { JoinPacketData, NetworkPacketData, PacketType, UseNetworkPacket } from '@virtcon2/network-packet';

export class Network {
  socket: Socket;
  isConnected: boolean = false;
  lobbies: ServerLobby[] = [];

  constructor() {
    const socket = io('ws://localhost:3000');
    this.socket = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    socket.on('packet', (packet: string) => {
      const packetJSON = JSON.parse(packet) as NetworkPacketData<unknown>;
      const event = packetJSON.packet_type.charAt(0).toUpperCase() + packetJSON.packet_type.slice(1);

      console.log(`Received packet: ${packetJSON.packet_type} ${JSON.stringify(packetJSON.data)}`);
      events.notify(('network' + event) as any, packetJSON.data);
    });
  }

  join(worldId: string) {
    Game.worldId = worldId;
    const packet: NetworkPacketData<JoinPacketData> = { data: { name: 'Olle', id: uuidv4(), position: [0, 0] }, packet_type: PacketType.JOIN, world_id: Game.worldId };

    this.sendPacket(packet);
  }
  disconnect() {
    this.socket.disconnect();
  }
  sendPacket(packet: NetworkPacketData<unknown>) {
    if (!packet.world_id || !packet.packet_type) return;
    console.log(`Sending packet: ${packet.packet_type} ${JSON.stringify(packet)}`);
    this.socket.emit('packet', JSON.stringify(packet));
  }
}
