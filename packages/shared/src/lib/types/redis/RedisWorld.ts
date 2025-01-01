import { RedisPlayer } from './RedisPlayer';
import { RedisWorldBuilding } from './RedisWorldBuilding';

export interface RedisWorld {
  players: RedisPlayer[];
  buildings: RedisWorldBuilding[];
  height_map: number[][];
  id: string;
}
