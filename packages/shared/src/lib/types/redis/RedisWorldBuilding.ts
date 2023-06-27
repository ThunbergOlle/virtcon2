// eslint-disable-next-line @nx/enforce-module-boundaries
import { DBBuilding } from '@virtcon2/static-game-data';
import { ServerInventoryItem } from './RedisInventoryItem';
import { RedisWorldResource } from './RedisWorldResource';

export interface RedisWorldBuilding {
  id: number;
  building: DBBuilding;
  world_resource?: RedisWorldResource;
  active: boolean;
  x: number;
  y: number;
  rotation: number;
  world_building_inventory?: ServerInventoryItem[];
  current_processing_ticks: number;
  output_world_building?: RedisWorldBuilding;
  output_pos_x?: number;
  output_pos_y?: number;
}
