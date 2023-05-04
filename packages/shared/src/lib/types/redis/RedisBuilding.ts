import { BuildingType } from '../building';
import { ItemName } from '../item';
import { RedisJSONObject } from './RedisTypes';

export interface ServerBuilding extends RedisJSONObject {
  id: string;
  position: [number, number]
  inventory: { type: ItemName }[];
  building_type: BuildingType;
}
