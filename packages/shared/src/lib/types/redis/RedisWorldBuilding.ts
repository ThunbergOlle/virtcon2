import { ServerInventoryItem } from './RedisInventoryItem';
import { RedisWorldResource } from './RedisWorldResource';

export interface RedisWorldBuilding {
  id: number;
  building: { id: number; width: number; height: number };
  world_resource?: RedisWorldResource;
  active: boolean;
  x: number;
  y: number;
  rotation: number;
  world_building_inventory?: ServerInventoryItem[];
  output_world_building?: { id: number };
  output_pos_x?: number;
  output_pos_y?: number;
  inspectors: string[]; // Socket IDs of players inspecting this building
}
