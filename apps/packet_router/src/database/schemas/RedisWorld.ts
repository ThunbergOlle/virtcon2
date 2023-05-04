import { RedisJSONObject, ServerBuilding, ServerPlayer } from '@shared';

export interface RedisWorld extends RedisJSONObject {
  players: ServerPlayer[];
  buildings: ServerBuilding[];
  name: string;
  id: string;
}
