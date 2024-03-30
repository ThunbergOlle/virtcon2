import { ServerInventoryItem } from './RedisInventoryItem';
export interface RedisPlayer {
  id: string;
  name: string;
  position: [number, number];
  inventory: ServerInventoryItem[];
  socket_id: string;
  world_id: string;
}
