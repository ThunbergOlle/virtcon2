// eslint-disable-next-line @nx/enforce-module-boundaries
import { DBBuilding } from '@virtcon2/static-game-data';
import { ServerInventoryItem } from './RedisInventoryItem';

export interface RedisWorldBuilding {
  id: number;
  building: DBBuilding;
  active: boolean;
  x: number;
  y: number;
  rotation: number;
  world_building_inventory?: ServerInventoryItem[];
  output_world_building?: { id: number };
}
