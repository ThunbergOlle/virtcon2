import { ServerInventoryItem } from './serverInventoryItem';
export interface ServerPlayer {
  id: string;
  name: string;
  position: [number, number];
  inventory: ServerInventoryItem[];
  world_id: string;
}
