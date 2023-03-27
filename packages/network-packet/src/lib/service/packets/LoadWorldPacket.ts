import { ServerPlayer } from '@shared';

export interface LoadWorldPacket {
  player: ServerPlayer;
  players: ServerPlayer[];
}

