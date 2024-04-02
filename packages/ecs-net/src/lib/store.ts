import { ComponentSchema } from './component';
import { MAX_ENTITY_AMOUNT } from './entity';
import { i16, i32, ui16, ui32, ui8 } from './types';

export const $componentStore = Symbol('$componentStore');
export const $entityStore = Symbol('$entityStore');

export const STORE: {
  [$componentStore]: Record<string, ComponentStore<unknown>>;
  [$entityStore]: Array<Array<string>>;
} = {
  [$componentStore]: {},
  [$entityStore]: new Array(MAX_ENTITY_AMOUNT).fill(null),
};

export type ComponentKeys<K> = {
  [key in keyof K]: Uint8Array | Uint16Array | Uint32Array | Int16Array | Int32Array;
};

type WithStore = {
  identifier: string;
};

export type ComponentStore<K> = ComponentKeys<K> & WithStore;

export const createComponentStore = <K>(identifier: string, schema: ComponentSchema<K>): ComponentStore<K> => {
  const schemaKeys: ComponentKeys<K> = {} as ComponentKeys<K>;

  for (const key in schema) {
    switch (schema[key]) {
      case ui8:
        schemaKeys[key] = new Uint8Array(MAX_ENTITY_AMOUNT);
        break;
      case ui16:
        schemaKeys[key] = new Uint16Array(MAX_ENTITY_AMOUNT);
        break;
      case ui32:
        schemaKeys[key] = new Uint32Array(MAX_ENTITY_AMOUNT);
        break;
      case i16:
        schemaKeys[key] = new Int16Array(MAX_ENTITY_AMOUNT);
        break;
      case i32:
        schemaKeys[key] = new Int32Array(MAX_ENTITY_AMOUNT);
        break;
    }
  }

  STORE[$componentStore][identifier] = { ...schemaKeys, identifier };

  return STORE[$componentStore][identifier] as ComponentStore<K>;
};
