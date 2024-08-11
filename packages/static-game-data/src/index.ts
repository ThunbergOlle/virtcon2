import item_coal from './lib/items/db/item_coal';
import { item_conveyor, building_conveyor } from './lib/items/db/item_conveyor';
import { item_drill, building_drill } from './lib/items/db/item_drill';
import item_iron from './lib/items/db/item_iron';
import { item_pipe, building_pipe } from './lib/items/db/item_pipe';
import { item_sawmill, building_sawmill } from './lib/items/db/item_sawmill';
import item_stick from './lib/items/db/item_stick';
import item_stone from './lib/items/db/item_stone';
import item_wood from './lib/items/db/item_wood';
import { DBItemName } from './lib/items/item_type';
import { item_conveyor_recipe } from './lib/items_recipe/db/item_conveyor';
import { item_pipe_recipe } from './lib/items_recipe/db/item_pipe';
import { item_sawmill_recipe } from './lib/items_recipe/db/item_sawmill';
import { item_stick_recipe } from './lib/items_recipe/db/item_stick';
import { ResourceNames, Resources } from './lib/resources/resources_type';

/* Items */
export * from './lib/items/item_type';
export * from './lib/items/db/item_wood';
export * from './lib/items/db/item_stick';
export * from './lib/items/db/item_sawmill';
export * from './lib/items/db/item_pipe';
export * from './lib/items/db/item_drill';
export * from './lib/items/db/item_conveyor';

export const all_db_items = [item_wood, item_stick, item_sawmill, item_pipe, item_drill, item_stone, item_conveyor, item_coal, item_iron];
export const all_spawnable_db_items = all_db_items.filter((i) => i.spawnSettings);
export const get_item_by_id = (id: number) => {
  return all_db_items.find((item) => item.id === id);
};

/* Resources */
export * from './lib/resources/resources_type';

export const get_resource_by_item_name = (itemName: DBItemName): ResourceNames | null => {
  return Object.keys(Resources).find((resourceName) => Resources[resourceName as ResourceNames].item === itemName) as ResourceNames;
};

/* Item Recipes */
export * from './lib/items_recipe/item_recipe_type';

export * from './lib/items_recipe/db/item_stick';
export * from './lib/items_recipe/db/item_sawmill';
export * from './lib/items_recipe/db/item_pipe';

export const all_db_items_recipes = [...item_stick_recipe, ...item_sawmill_recipe, ...item_pipe_recipe, ...item_conveyor_recipe];

/* Buildings */
export * from './lib/items/building_type';
export const all_db_buildings = [building_sawmill, building_pipe, building_drill, building_conveyor];

export const get_building_by_id = (id: number) => {
  return all_db_buildings.find((building) => building.id === id);
};

/* Player */
export * from './lib/player/player_type';
