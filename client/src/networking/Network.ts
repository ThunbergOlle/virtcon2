import { Lobby } from '@shared/types/lobby';
import { Socket, io } from 'socket.io-client';
import { events } from '../events/Events';

export class Network {
  socket: Socket;
  isConnected: boolean = false;
  lobbies: Lobby[] = [];

  constructor() {
    const socket = io('ws://localhost:3000');
    this.socket = socket;
    socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });
    socket.onAny((event, ...args) => {
      // capitalize the first letter of the event
      event = event.charAt(0).toUpperCase() + event.slice(1);
      console.log("Event: ", event, args)
      events.notify(('network' + event) as any, ...args);
    });
  }
  join(lobbyId: string) {
    this.socket.emit('join', lobbyId);
  }
}
