import { RedisPlayer, asRedisItem } from '@shared';
import { RedisClientType } from 'redis';
import * as socketio from 'socket.io';

const addPlayer = (player: RedisPlayer, worldId: string, redisClient: RedisClientType) =>
  redisClient.json.arrAppend('worlds', `$.${worldId}.players`, player as never);

const removePlayer = async (player: RedisPlayer, worldId: string, socket: socketio.Socket, redisClient: RedisClientType) => {
  console.log(`Removing player ${player.id} from world ${worldId}`);
  // Remove player from redis world
  await redisClient.json.del('worlds', `$.${worldId}.players[?(@.id=='${player.id}')]`);
  socket.broadcast.to(worldId).emit('playerLeave', player);
  // Remove player from socket.io room
  socket.leave(worldId);
};

const getPlayer = async (playerId: string, redisClient: RedisClientType, worldId?: string): Promise<RedisPlayer | null> => {
  const player = (await redisClient.json.get('worlds', {
    path: `$.${worldId || '*'}.players[?(@.id=='${playerId}')]`,
  })) as unknown as RedisPlayer[];
  if (!player || !player[0]) return null;
  return player[0];
};

const getPlayerBySocketId = async (socketId: string, redisClient: RedisClientType): Promise<RedisPlayer | null> => {
  const player = (await redisClient.json.get('worlds', {
    path: `$.*.players[?(@.socket_id=='${socketId}')]`,
  })) as unknown as RedisPlayer[];
  if (!player || !player.length) return null;
  return player[0];
};
const savePlayer = async (player: RedisPlayer, redisClient: RedisClientType) => {
  await redisClient.json.set('worlds', `$.${player.world_id}.players[?(@.id=='${player.id}')]`, asRedisItem(player));
};

const updatePlayer = async ({
  worldId,
  playerId,
  attributes,
  redisClient,
}: {
  worldId: string;
  playerId: string;
  attributes: Partial<RedisPlayer>;
  redisClient: RedisClientType;
}) => {
  const player = await getPlayer(playerId, redisClient, worldId);
  if (!player) return null;
  const updatedPlayer = { ...player, ...attributes };
  await savePlayer(updatedPlayer, redisClient);
  return updatedPlayer;
};

export default {
  addPlayer,
  removePlayer,
  getPlayer,
  getPlayerBySocketId,
  savePlayer,
  updatePlayer,
};
