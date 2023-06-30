import 'reflect-metadata';
import { DeconstructRedisPacket, NetworkPacketData, RedisPacketPublisher } from '@virtcon2/network-packet';
import dotenv from 'dotenv';
import { cwd } from 'process';

import { RedisClientType, createClient as createRedisClient } from 'redis';
import all_packet_handler, { sync_packet_handler } from './packet/packet_handler';
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

// Packet queue for handling packets in order.
const packet_queue: NetworkPacketData<unknown>[] = [];

redisSubClient.pSubscribe(`${RedisPacketPublisher.channel_prefix}*`, (message, channel) => {
  const deconstructed_packet = DeconstructRedisPacket<unknown>(message, channel);
  all_packet_handler(deconstructed_packet, redisPubClient, packet_queue);
});
const handle_queue = async () => {
  if (packet_queue.length) {
    const packet = packet_queue.shift();
    await sync_packet_handler(packet, redisPubClient);
  }
  setTimeout(handle_queue, 0);
};
handle_queue();

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

