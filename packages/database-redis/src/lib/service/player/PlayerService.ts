import { ServerPlayer, asRedisItem } from '@shared';
import { RedisClientType } from 'redis';
import * as socketio from 'socket.io';

const addPlayer = (player: ServerPlayer, worldId: string, redisClient: RedisClientType) =>
  redisClient.json.arrAppend('worlds', `$.${worldId}.players`, player as never);

const removePlayer = async (player: ServerPlayer, worldId: string, socket: socketio.Socket, redisClient: RedisClientType) => {
  console.log(`Removing player ${player.id} from world ${worldId}`);
  // Remove player from redis world
  await redisClient.json.del('worlds', `$.${worldId}.players[?(@.id=='${player.id}')]`);
  socket.broadcast.to(worldId).emit('playerLeave', player);
  // Remove player from socket.io room
  socket.leave(worldId);
};

const getPlayer = async (playerId: string, redisClient: RedisClientType): Promise<ServerPlayer | null> => {
  const player = (await redisClient.json.get('worlds', {
    path: `$.*.players[?(@.id=='${playerId}')]`,
  })) as unknown as ServerPlayer[];
  if (!player || !player[0]) return null;
  return player[0];
};
const getPlayerBySocketId = async (socketId: string, redisClient: RedisClientType): Promise<ServerPlayer | null> => {
  const player = (await redisClient.json.get('worlds', {
    path: `$.*.players[?(@.socket_id=='${socketId}')]`,
  })) as unknown as ServerPlayer[];
  if (!player || !player.length) return null;
  return player[0];
};
const savePlayer = async (player: ServerPlayer, redisClient: RedisClientType) => {
  await redisClient.json.set('worlds', `$.${player.world_id}.players[?(@.id=='${player.id}')]`, asRedisItem(player));
};

export default {
  addPlayer,
  removePlayer,
  getPlayer,
  getPlayerBySocketId,
  savePlayer,
};
