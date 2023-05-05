import { DeconstructRedisPacket, RedisPacketPublisher } from '@virtcon2/network-packet';
import dotenv from 'dotenv';
import { cwd } from 'process';

import { createClient as createRedisClient } from 'redis';

dotenv.config({ path: `${cwd()}/.env` });

const redisClient = createRedisClient();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect();

redisClient.pSubscribe(`${RedisPacketPublisher.channel_prefix}*`, (message, channel) => {
  const deconstructed_packet = 
});
