import { RedisWorld, RedisPlayer } from '@shared';

export interface LoadWorldPacketData {
  player: RedisPlayer;
  world: RedisWorld;
}
