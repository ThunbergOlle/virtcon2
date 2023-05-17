import { ServerInventoryItem } from './RedisInventoryItem';
export interface ServerPlayer  {
  id: string;
  name: string;
  position: [number, number];
  inventory: ServerInventoryItem[];
  socket_id: string
  world_id: string;
}
