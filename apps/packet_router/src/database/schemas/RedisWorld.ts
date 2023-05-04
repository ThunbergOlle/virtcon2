import { ServerPlayer, ServerBuilding } from '@shared';

export interface RedisWorld {
  players: ServerPlayer[];
  buildings: ServerBuilding[];
  name: string;
  id: string;
}
