import building_sawmill from './lib/buildings/db/building_sawmill';
import item_sawmill from './lib/items/db/item_sawmill';
import item_stick from './lib/items/db/item_stick';
import item_wood from './lib/items/db/item_wood';
import { DBItemName } from './lib/items/item_type';
import { item_sawmill_recipe } from './lib/items_recipe/db/item_sawmill';
import { item_stick_recipe } from './lib/items_recipe/db/item_stick';
import { ResourceNames, Resources } from './lib/resources/resources_type';

/* Items */
export * from './lib/items/item_type';
export * from './lib/items/db/item_wood';
export * from './lib/items/db/item_stick';
export * from './lib/items/db/item_sawmill';

export const all_db_items = [item_wood, item_stick, item_sawmill];
export const all_spawnable_db_items = all_db_items.filter((i) => i.spawnSettings);
export const get_item_by_id = (id: number) => {
  return all_db_items.find((item) => item.id === id);
};

/* Resources */
export * from './lib/resources/resources_type';

export const get_resource_by_item_name = (itemName: DBItemName): ResourceNames | null => {
  return Object.keys(Resources).find((resourceName) => Resources[resourceName].item === itemName) as ResourceNames;
};

/* Item Recipes */
export * from './lib/items_recipe/item_recipe_type';

export * from './lib/items_recipe/db/item_stick';
export * from './lib/items_recipe/db/item_sawmill';

export const all_db_items_recipes = [...item_stick_recipe, ...item_sawmill_recipe];

/* Buildings */
export * from './lib/buildings/building_type';
export const all_db_buildings = [building_sawmill];

