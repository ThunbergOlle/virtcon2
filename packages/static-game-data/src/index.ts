import item_stick from './lib/items/db/item_stick';
import item_wood from './lib/items/db/item_wood';
import { item_stick_recipe } from './lib/items_recipe/db/item_stick';

/* Items */
export * from './lib/items/item_type';
export * from './lib/items/db/item_wood';
export * from './lib/items/db/item_stick';

export const all_db_items = [item_wood, item_stick];
export const all_spawnable_db_items = all_db_items.filter((i) => i.spawnSettings);
export const get_item_by_id = (id: number) => {
  return all_db_items.find((item) => item.id === id);
};

/* Resources */
export * from './lib/resources/resources_type';

/* Item Recipes */
export * from './lib/items_recipe/item_recipe_type';

export const all_db_items_recipes = [...item_stick_recipe];
