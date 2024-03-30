import { RedisPlayer } from './RedisPlayer';
import { RedisWorldBuilding } from './RedisWorldBuilding';
import { RedisWorldResource } from './RedisWorldResource';

export interface RedisWorld {
  players: RedisPlayer[];
  resources: RedisWorldResource[];
  buildings: RedisWorldBuilding[];
  height_map: number[][];
  id: string;
}
