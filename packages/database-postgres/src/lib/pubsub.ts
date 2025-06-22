import { createRedisEventTarget } from '@graphql-yoga/redis-event-target';
import { createPubSub } from '@graphql-yoga/subscription';
import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

export const enum Topic {
  BUILDING_UPDATE = 'BUILDING_UPDATE',
  USER_INVENTORY_UPDATE = 'USER_INVENTORY_UPDATE',
}

export const pubSub = createPubSub<{
  [Topic.BUILDING_UPDATE]: [number];
  [Topic.USER_INVENTORY_UPDATE]: [number];
}>({
  eventTarget: createRedisEventTarget({
    publishClient: new Redis(redisUrl, {
      retryStrategy: (times) => Math.max(times * 100, 3000),
    }),
    subscribeClient: new Redis(redisUrl, {
      retryStrategy: (times) => Math.max(times * 100, 3000),
    }),
  }),
});
