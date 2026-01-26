import { DBBuilding } from './building_type';
import { DBItemRecipe } from '../items_recipe/item_recipe_type';
import { ResourcesType } from '../resources/resources_type';
import { HarvestableType } from '../harvestable_type';

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
  STONE = 'stone',
  SAND = 'sand',
  GLASS = 'glass',
  COAL = 'coal',
  IRON_ORE = 'iron_ore',
  BUILDING_FURNACE = 'building_furnace',
  BUILDING_SAWMILL = 'building_sawmill',
  BUILDING_DRILL = 'building_stone_drill',
  WOOD_AXE = 'wood_axe',
  WOOD_PICKAXE = 'wood_pickaxe',
  STONE_PICKAXE = 'stone_pickaxe',
  SAPLING = 'sapling',
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
  recipe?: DBItemRecipe[];
  is_building: boolean;
  building?: DBBuilding;
  buildingId?: number;
  animations?: {
    idle: number[];
  };
  resource?: ResourcesType;
  harvestable?: HarvestableType;
}
