import { ServerPlayer } from './RedisPlayer';
import { RedisWorldBuilding } from './RedisWorldBuilding';
import { RedisWorldResource } from './RedisWorldResource';

export interface RedisWorld {
  players: ServerPlayer[];
  resources: RedisWorldResource[];
  buildings: RedisWorldBuilding[];
  height_map: number[][];
  id: string;
}
