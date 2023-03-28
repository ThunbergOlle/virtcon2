import { ServerPlayer } from '@shared';

export interface LoadWorldPacketData {
  player: ServerPlayer;
  world: {
    players: ServerPlayer[];
  }
}

