import { v4 as uuidv4 } from 'uuid';
import * as socketio from 'socket.io';
import { Redis } from '../../database/Redis';
import { RedisWorld } from '../../database/schemas/RedisWorld';
import { ServerPlayer } from '@shared';
const getWorld = async (id: string, redis: Redis) => {
  const world = (await redis.client.json.get(`worlds`, {
    path: `$.${id}`,
  })) as any as RedisWorld[];
  if (!world || !world[0]) return null;
  return world[0];
};
const registerWorld = async (name: string, redis: Redis) => {
  /* Register world */
  const id = uuidv4();
  const world: RedisWorld = {
    id,
    name,
    players: [],
    buildings: [],
  };
  await redis.setJson('worlds', `$.${id}`, world);

  return world;
};

const unregisterWorld = async (id: string, redis: Redis) => {
  await redis.client.json.del('worlds', `$.${id}`);
};

const addPlayer = async (player: ServerPlayer, worldId: string, socket: socketio.Socket, redis: Redis) => {
  await redis.client.json.arrAppend('worlds', `$.${worldId}.players`, player as any);
  socket.join(worldId);
};

const removePlayer = async (player: ServerPlayer, worldId: string, socket: socketio.Socket, redis: Redis) => {
  console.log(`Removing player ${player.id} from world ${worldId}`)
  // Remove player from redis world
  await redis.client.json.del('worlds', `$.${worldId}.players[?(@.id=='${player.id}')]`);
  socket.broadcast.to(worldId).emit('playerLeave', player);
  // Remove player from socket.io room
  socket.leave(worldId);
};

const getPlayer = async (playerId: string, redis: Redis): Promise<ServerPlayer> => {
  const player = (await redis.client.json.get('worlds', {
    path: `$.*.players[?(@.id=='${playerId}')]`,
  })) as any as ServerPlayer[];
  if (!player || !player[0]) return null;
  return player[0];
};
const getPlayerBySocketId = async (socketId: string, redis: Redis): Promise<ServerPlayer> => {
  const player = await redis.client.json.get('worlds', {
    path: `$.*.players[?(@.socket=='${socketId}')]`,
  });
  if (!player || !player[0]) return null;
  return player[0];
};
const savePlayer = async (player: ServerPlayer, redis: Redis) => {
  await redis.setJson('worlds', `$.${player.world_id}.players[?(@.id=='${player.id}')]`, player);
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
