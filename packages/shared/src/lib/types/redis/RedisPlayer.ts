import { RedisJSONObject } from './RedisTypes';
import { ServerInventoryItem } from './RedisInventoryItem';
export interface ServerPlayer extends RedisJSONObject {
  id: string;
  name: string;
  position: [number, number];
  inventory: ServerInventoryItem[];
  world_id: string;
}
