import item_wood from './lib/items/db/item_wood';

/* Items */
export * from './lib/items/item_type';

export * from './lib/items/db/item_wood';

export const all_db_items = [item_wood];
export const get_item_by_id = (id: number) => {
  return all_db_items.find((item) => item.id === id);
};
/* Resources */
export * from './lib/resources/resources_type';
