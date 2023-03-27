import { NetworkServerPlayerMoveEvent } from '@shared';
import { Socket } from 'socket.io';
import { Redis } from '../../database/Redis';


export const setupPlayerEventHandler = (socket: Socket, redis: Redis) => {

  // socket.on('join', async (worldId: string) => {
  //   playerJoinEvent(worldId, socket, redis);
  // });
  // socket.on('playerMove', async (data: NetworkServerPlayerMoveEvent) => {
  //   playerMoveEvent(data, socket, redis);
  // });
  // socket.on('playerSetPosition', async (data: NetworkServerPlayerMoveEvent) => {
  //   playerMoveEvent(data, socket, redis, true);
  // });
};
