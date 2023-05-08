import { RedisJSONObject } from './RedisTypes';

export interface RedisWorldResource extends RedisJSONObject {
  id: number;
  x: number;
  y: number;
  item: {
    id: number;
  };
  world_building: null;
}
