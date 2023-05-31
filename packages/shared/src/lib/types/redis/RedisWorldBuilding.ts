// eslint-disable-next-line @nx/enforce-module-boundaries
import { DBBuilding, DBItem } from '@virtcon2/static-game-data';
import { RedisWorldResource } from './RedisWorldResource';

export interface RedisWorldBuilding {
  id: number;
  building: DBBuilding;
  world_resource?: RedisWorldResource;
  active: boolean;
  x: number;
  y: number;
  world_building_inventory?: RedisWorldBuildingInventory[];
  output_world_building?: RedisWorldBuilding;
}

export interface RedisWorldBuildingInventory {
  item: DBItem;
  quantity: number;
  id: string;
}
