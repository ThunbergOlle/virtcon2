import { LogApp, LogLevel, log } from '@shared';
import { all_db_items } from '@virtcon2/static-game-data';
import { promises as fs } from 'fs';
import { validate } from 'jsonschema';
import { Item } from '../entity/item/Item';
export async function setupDatabase() {
  SetupItems();
}

async function SetupItems() {
  const schema = getJsonSchema('items');

  for (const item of all_db_items) {
    // validate the
    const result = validate(item, schema);
    if (result.errors.length > 0) {
      log(`Invalid item: ${item}, ${result.errors}`, LogLevel.ERROR, LogApp.API);
      continue;
    }
    await Item.upsert(item as unknown as Item, { upsertType: 'on-conflict-do-update', conflictPaths: ['id'] });
  }
}

async function getJsonSchema(type: string) {
  const jsonSchema = await fs.readFile(`packages/static-game-data/src/lib/${type}/db/_schema.json`, 'utf-8');
  return JSON.parse(jsonSchema);
}
