import { ServerLobby, ServerPlayer } from '@shared';
import { JoinPacket } from '@virtcon2/network-packet';

import { Socket, io } from 'socket.io-client';
import { events } from '../../events/Events';
import Game from '../Game';

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
      console.log("Received packet: " + packet);
    });
    socket.onAny((event, ...args) => {
      // capitalize the first letter of the event
      event = event.charAt(0).toUpperCase() + event.slice(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events.notify(('network' + event) as any, ...args);
    });
  }
  join(worldId: string) {
    Game.worldId = worldId;
    const packet = new JoinPacket().serialize({ player: new ServerPlayer('test', worldId)});
    this.sendPacket(packet);
  }
  disconnect() {
    this.socket.disconnect();
  }
  sendPacket(packet: string) {
    this.socket.emit('packet', `${Game.worldId}_${packet}`);
  }
}
