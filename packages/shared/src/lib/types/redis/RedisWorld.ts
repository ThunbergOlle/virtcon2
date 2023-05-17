import { ServerPlayer } from './RedisPlayer';
import { RedisWorldResource } from './RedisWorldResource';

export interface RedisWorld {
  players: ServerPlayer[];
  resources: RedisWorldResource[];
  height_map: number[][];
  id: string;
}
