import { RedisWorld, RedisPlayer, asRedisItem } from '@shared';
import { RedisClientType } from 'redis';
import * as socketio from 'socket.io';

const getWorld = async (id: string, redisClient: RedisClientType) => {
  const world = (await redisClient.json.get(`worlds`, {
    path: `$.${id}`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any as RedisWorld[];
  if (!world || !world[0]) return null;
  return world[0];
};
const registerWorld = async (world: RedisWorld, redisClient: RedisClientType) => {
  // initialize processing tick for all buildings
  // if this is not done, we will get a null pointer exception in Rust
  world.buildings.forEach((b) => {
    b.current_processing_ticks = 0;
  });
  await redisClient.json.set('worlds', `$.${world.id}`, asRedisItem(world));
  return world;
};

const unregisterWorld = async (id: string, redisClient: RedisClientType) => {
  await redisClient.json.del('worlds', `$.${id}`);
};

export const World = {
  getWorld,
  registerWorld,
  unregisterWorld,
};
