import { ServerPlayer } from '@shared';
import { RedisClientType } from 'redis';
import * as socketio from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { RedisWorld } from '../../database/schemas/RedisWorld';

const getWorld = async (id: string, redisClient: RedisClientType) => {
  const world = (await redisClient.json.get(`worlds`, {
    path: `$.${id}`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any as RedisWorld[];
  if (!world || !world[0]) return null;
  return world[0];
};
const registerWorld = async (name: string, redisClient: RedisClientType) => {
  /* Register world */
  const id = uuidv4();
  const world: RedisWorld = {
    id,
    name,
    players: [],
    buildings: [],
  };
  await redisClient.json.set('worlds', `$.${id}`, world);

  return world;
};

const unregisterWorld = async (id: string, redisClient: RedisClientType) => {
  await redisClient.json.del('worlds', `$.${id}`);
};

const addPlayer = async (player: ServerPlayer, worldId: string, socket: socketio.Socket, redisClient: RedisClientType) => {
  await redisClient.json.arrAppend('worlds', `$.${worldId}.players`, player as any);
  socket.join(worldId);
};

const removePlayer = async (player: ServerPlayer, worldId: string, socket: socketio.Socket, redisClient: RedisClientType) => {
  console.log(`Removing player ${player.id} from world ${worldId}`);
  // Remove player from redis world
  await redisClient.json.del('worlds', `$.${worldId}.players[?(@.id=='${player.id}')]`);
  socket.broadcast.to(worldId).emit('playerLeave', player);
  // Remove player from socket.io room
  socket.leave(worldId);
};

const getPlayer = async (playerId: string, redisClient: RedisClientType): Promise<ServerPlayer> => {
  const player = (await redisClient.json.get('worlds', {
    path: `$.*.players[?(@.id=='${playerId}')]`,
  })) as any as ServerPlayer[];
  if (!player || !player[0]) return null;
  return player[0];
};
const getPlayerBySocketId = async (socketId: string, redisClient: RedisClientType): Promise<ServerPlayer> => {
  const player = await redisClient.json.get('worlds', {
    path: `$.*.players[?(@.socket_id=='${socketId}')]`,
  });
  if (!player || !player[0]) return null;
  return player[0];
};
const savePlayer = async (player: ServerPlayer, redisClient: RedisClientType) => {
  await redisClient.json.set('worlds', `$.${player.world_id}.players[?(@.id=='${player.id}')]`, player);
};
export const World = {
  getWorld,
  registerWorld,
  unregisterWorld,
  addPlayer,
  removePlayer,
  getPlayer,
  getPlayerBySocketId,
  savePlayer,
};
