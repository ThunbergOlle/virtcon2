import 'reflect-metadata';
import { DeconstructRedisPacket, RedisPacketPublisher } from '@virtcon2/network-packet';
import dotenv from 'dotenv';
import { cwd } from 'process';

import { RedisClientType, createClient as createRedisClient } from 'redis';
import packet_handler from './packet/packet_handler';
import { AppDataSource } from '@virtcon2/database-postgres';
import { LogApp, LogLevel, log } from '@shared';
import { worldService } from '@virtcon2/database-redis';

dotenv.config({ path: `${cwd()}/.env` });
AppDataSource.initialize();
const redisSubClient = createRedisClient() as RedisClientType;
const redisPubClient = createRedisClient() as RedisClientType;

redisPubClient.on('error', (err) => log(err, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER));
redisPubClient.connect();

redisSubClient.on('error', (err) => log(err, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER));
redisSubClient.connect();

redisSubClient.pSubscribe(`${RedisPacketPublisher.channel_prefix}*`, (message, channel) => {
  // get world_id of t
  const deconstructed_packet = DeconstructRedisPacket<unknown>(message, channel);
  packet_handler(deconstructed_packet, redisPubClient);
});

async function exit() {
  // remove all worlds from redis
  await worldService.clearWorlds(redisPubClient);

  redisSubClient.quit();
  redisPubClient.quit();

  log('Redis clients closed and worlds cleaned up.', LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
  process.exit(0);
}
// on sigint, close the redis clients
process.on('SIGTERM', exit);
process.on('SIGINT', exit);

