import { LogApp, LogLevel, log } from '@shared';
import { all_db_buildings, all_db_items, all_db_items_recipes } from '@virtcon2/static-game-data';
import { promises as fs } from 'fs';
import { validate } from 'jsonschema';
import { Item } from '../entity/item/Item';
import { ItemRecipe } from '../entity/item_recipe/ItemRecipe';
import { Building } from '../entity/building/Building';
import { AppDataSource } from '../data-source';
export async function setupDatabase() {
  SetupItems();
}

async function SetupItems() {
  const itemsSchema = getJsonSchema('items');
  const itemsRecipeSchema = getJsonSchema('items_recipe');

  /* Import items */
  for (const item of all_db_items) {
    // validate the
    const result = validate(item, itemsSchema);
    console.log(item);
    if (result.errors.length > 0) {
      log(`Invalid item: ${item}, ${result.errors}`, LogLevel.ERROR, LogApp.API);
      continue;
    }
    await Item.upsert(item as unknown as Item, { upsertType: 'on-conflict-do-update', conflictPaths: ['id'] });
  }
  for (const item_recipe of all_db_items_recipes) {
    // validate the
    const result = validate(item_recipe, itemsRecipeSchema);
    if (result.errors.length > 0) {
      log(`Invalid item recipe: ${item_recipe}, ${result.errors}`, LogLevel.ERROR, LogApp.API);
      continue;
    }
    await ItemRecipe.upsert(item_recipe as unknown as ItemRecipe, { upsertType: 'on-conflict-do-update', conflictPaths: ['id'] });
  }
  for (const building of all_db_buildings) {
    await Building.upsert(building as unknown as Building, {
      upsertType: 'on-conflict-do-update',
      conflictPaths: ['id'],
    });
    // For some reason, the upsert doesn't work for the many-to-many relationship, so we have to do it manually
    for (const item of building.items_to_be_placed_on) {
      await AppDataSource.query(
        `INSERT INTO building_items_to_be_placed_on_item ("buildingId", "itemId") VALUES ('${building.id}', '${item.id}') ON CONFLICT DO NOTHING;`,
      );
    }
  }
}

async function getJsonSchema(type: string) {
  const jsonSchema = await fs.readFile(`packages/static-game-data/src/lib/${type}/db/_schema.json`, 'utf-8');
  return JSON.parse(jsonSchema);
}
