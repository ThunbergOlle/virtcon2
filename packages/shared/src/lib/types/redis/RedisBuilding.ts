// eslint-disable-next-line @nx/enforce-module-boundaries
import { DBItemName } from '@virtcon2/static-game-data';
import { BuildingType } from '../building';
import { RedisJSONObject } from './RedisTypes';

export interface ServerBuilding extends RedisJSONObject {
  id: string;
  position: [number, number]
  inventory: { type: DBItemName }[];
  building_type: BuildingType;
}
