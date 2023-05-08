import { RedisWorld, ServerPlayer } from '@shared';

export interface LoadWorldPacketData {
  player: ServerPlayer;
  world: RedisWorld
}

