import item_coal from './lib/items/db/item_coal';
import { item_drill, building_drill } from './lib/items/db/item_drill';
import item_iron_ore from './lib/items/db/item_iron';
import { item_sawmill, building_sawmill } from './lib/items/db/item_sawmill';
import item_stick from './lib/items/db/item_stick';
import item_stone from './lib/items/db/item_stone';
import { stone_pickaxe, stone_pickaxe_tool } from './lib/items/db/item_stone_pickaxe';
import item_wood from './lib/items/db/item_wood';
import { wood_axe, wood_axe_tool } from './lib/items/db/item_wood_axe';
import { wood_pickaxe, wood_pickaxe_tool } from './lib/items/db/item_wood_pickaxe';
import { DBItemName } from './lib/items/item_type';
import { item_drill_recipe } from './lib/items_recipe/db/item_drill';
import { item_sawmill_recipe } from './lib/items_recipe/db/item_sawmill';
import { item_stick_recipe } from './lib/items_recipe/db/item_stick';
import { wood_axe_recipe } from './lib/items_recipe/db/item_wood_axe';
import { wood_pickaxe_recipe } from './lib/items_recipe/db/item_wood_pickaxe';
import { stone_pickaxe_recipe } from './lib/items_recipe/db/item_stone_pickaxe';
import { ResourceNames, Resources } from './lib/resources/resources_type';

/* Items */
export * from './lib/items/item_type';
export * from './lib/items/db/item_wood';
export * from './lib/items/db/item_stick';
export * from './lib/items/db/item_sawmill';
export * from './lib/items/db/item_drill';
export * from './lib/items/db/item_wood_axe';
export * from './lib/items/db/item_wood_pickaxe';
export * from './lib/items/db/item_stone_pickaxe';

/* Tools */
export * from './lib/items/tool_type';

export const all_db_items = [
  item_wood,
  item_stick,
  item_sawmill,
  item_drill,
  item_stone,
  item_coal,
  item_iron_ore,
  wood_axe,
  wood_pickaxe,
  stone_pickaxe,
];
export const all_spawnable_db_items = all_db_items
  .filter((i) => i.spawnSettings)
  .sort((a, b) => a.spawnSettings!.minHeight - b.spawnSettings!.minHeight);
export const get_item_by_id = (id: number) => {
  return all_db_items.find((item) => item.id === id);
};
export const getItemByName = (name: DBItemName) => all_db_items.find((item) => item.name === name);

const allTools = [wood_axe_tool, wood_pickaxe_tool, stone_pickaxe_tool];
export const get_tool_by_item_name = (itemName: DBItemName) => allTools.find((tool) => tool.item === itemName);

/* Resources */
export * from './lib/resources/resources_type';

export const get_resource_by_item_name = (itemName: DBItemName): ResourceNames | null => {
  return Object.keys(Resources).find((resourceName) => Resources[resourceName as ResourceNames].item === itemName) as ResourceNames;
};

/* Item Recipes */
export * from './lib/items_recipe/item_recipe_type';

export * from './lib/items_recipe/db/item_stick';
export * from './lib/items_recipe/db/item_sawmill';
export * from './lib/items_recipe/db/item_drill';
export * from './lib/items_recipe/db/item_wood_axe';
export * from './lib/items_recipe/db/item_wood_pickaxe';
export * from './lib/items_recipe/db/item_stone_pickaxe';

export const all_db_items_recipes = [
  ...item_stick_recipe,
  ...item_sawmill_recipe,
  ...item_drill_recipe,
  ...wood_axe_recipe,
  ...wood_pickaxe_recipe,
  ...stone_pickaxe_recipe,
];

/* Buildings */
export * from './lib/items/building_type';
export const all_db_buildings = [building_sawmill, building_drill];

export const get_building_by_id = (id: number) => {
  return all_db_buildings.find((building) => building.id === id);
};

/* Player */
export * from './lib/player/player_type';

export * from './lib/worldGeneration';
