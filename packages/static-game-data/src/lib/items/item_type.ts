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
  STICK = 'stick',
  SAND = 'sand',
  GLASS = 'glass',
  COAL = 'coal',
  BUILDING_PIPE = 'building_pipe',
  BUILDING_FURNACE = 'building_furnace',
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
  rarity: DBItemRarity;
  spawnSettings?: DBItemSpawnSettings;
  recipe?: DBItemRecipe[];
}
