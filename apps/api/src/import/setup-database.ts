import { LogApp, LogLevel, log } from '@shared';
import fs from 'fs/promises';
import { glob } from 'glob';
import { validate } from 'jsonschema';
import { Item } from '../entity/item/Item';
export async function setupDatabase() {
  SetupItems();
}

async function SetupItems() {
  const [schema, files] = await Promise.all([getJsonSchema('items'), getFiles('items')]);

  for (const file of files) {
    const item = await readLocalFile<Item>(file);
    // validate the
    const result = validate(item, schema);
    if (result.errors.length > 0) {
      log(`Invalid item: ${file}, ${result.errors}`, LogLevel.ERROR, LogApp.API);
      continue;
    }
    await Item.upsert(item, {upsertType: 'on-conflict-do-update', conflictPaths: ['id']})
  }
}

async function getJsonSchema(type: string) {
  const jsonSchema = await fs.readFile(`apps/api/src/import/db/${type}/_schema.json`, 'utf-8');
  return JSON.parse(jsonSchema);
}
async function getFiles(type: string) {
  return glob.sync(`apps/api/src/import/db/${type}/*.json`, { ignore: '*/**/_schema.json' });
}

async function readLocalFile<T>(name: string): Promise<T> {
  return JSON.parse(await fs.readFile(name, 'utf-8'));
}
