import { DBBuilding } from './building_type';
import { DBItemRecipe } from '../items_recipe/item_recipe_type';

export enum DBItemRarity {
  common = 'common',
  uncommon = 'uncommon',
  rare = 'rare',
  epic = 'epic',
  legendary = 'legendary',
}
export enum DBItemName {
  WOOD = 'wood',
  WOOD_BIG = 'wood_big',
  STICK = 'stick',
  STONE = 'stone',
  SAND = 'sand',
  GLASS = 'glass',
  COAL = 'coal',
  IRON = 'iron',
  BUILDING_PIPE = 'building_pipe',
  BUILDING_CONVEYOR = 'building_conveyor',
  BUILDING_FURNACE = 'building_furnace',
  BUILDING_SAWMILL = 'building_sawmill',
  BUILDING_DRILL = 'building_drill',
}
export interface DBItemSpawnSettings {
  minHeight: number;
  maxHeight: number;
  chance: number;
}
export interface DBItem {
  id: number;
  display_name: string;
  name: DBItemName;
  description: string;
  icon: string;
  stack_size: number;
  rarity: DBItemRarity;
  spawnSettings?: DBItemSpawnSettings;
  recipe?: DBItemRecipe[];
  is_building: boolean;
  building?: DBBuilding;
  buildingId?: number;
  animations?: {
    idle: number[];
  };
}
