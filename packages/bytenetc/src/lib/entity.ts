export type Entity = number;

export const Types = {
  i8: 'i8',
  i16: 'i16',
  i32: 'i32',
  f32: 'f32',
  f64: 'f64',
  ui8: 'ui8',
  ui16: 'ui16',
  ui32: 'ui32',
} as const;

const MAX_ENTITIES = 1000;

type Type = (typeof Types)[keyof typeof Types] | [Type, number];
type AllArrayTypes = Int8Array | Int16Array | Int32Array | Float32Array | Float64Array | Uint8Array | Uint16Array | Uint32Array;
type TypeArray = AllArrayTypes | AllArrayTypes[];

export interface Component {
  [key: string]: TypeArray;
}

type EntityStore = Record<string, Component>;

const $componentStore: EntityStore = {
  /* 'position': [new Int16Array] */
};

const $entityStore = new Array(MAX_ENTITIES).fill(null);
const $queryCache = new Map();

const decodeName = (c: Component) => new TextDecoder().decode(c._name as Uint8Array);

const chooseArray = (type: Type, length: number): AllArrayTypes => {
  switch (type) {
    case Types.i8:
      return new Int8Array(length);
    case Types.i16:
      return new Int16Array(length);
    case Types.i32:
      return new Int32Array(length);
    case Types.f32:
      return new Float32Array(length);
    case Types.f64:
      return new Float64Array(length);
    case Types.ui8:
      return new Uint8Array(length);
    case Types.ui16:
      return new Uint16Array(length);
    case Types.ui32:
      return new Uint32Array(length);
    default:
      throw new Error(`Invalid type ${type}`);
  }
};

export const defineComponent = (name: string, schema: Record<string, Type>): Component => {
  const nameUint8 = new TextEncoder().encode(name);
  $componentStore[name] = {
    _name: nameUint8,
  };

  for (const key in schema) {
    if (schema[key] instanceof Array) {
      const [type, length] = schema[key] as unknown as [Type, number];

      const array = chooseArray(type, length);
      $componentStore[name][key] = new Array(MAX_ENTITIES).fill(array);
    }

    const array = chooseArray(schema[key], MAX_ENTITIES);
    $componentStore[name][key] = array;
  }

  return $componentStore[name];
};

export const addComponent = (entity: Entity, component: Component) => {
  if (!$componentStore[decodeName(component)]) {
    throw new Error(`Component ${component} does not exist`);
  }

  $entityStore[entity].push(component);

  $queryCache.clear();
};

export const removeComponent = (entity: Entity, component: Component) => {
  if (!$componentStore[decodeName(component)]) {
    throw new Error(`Component ${component} does not exist`);
  }

  $entityStore[entity] = $entityStore[entity].filter((c) => c !== component);
  const name = decodeName(component);

  for (const componentName in $componentStore) {
    if (componentName !== name) continue;

    for (const keyName in $componentStore[componentName]) {
      $componentStore[componentName][keyName][entity] = 0;
    }
  }

  $queryCache.clear();
};

export type QueryModifier = (entity: Entity) => boolean;

export const Not =
  (component: Component): QueryModifier =>
  (entityId: Entity) =>
    !$entityStore[entityId].includes(component);

export const defineQuery = (...components: (Component | QueryModifier)[]) => {
  const $cacheEntry = Symbol('queryCache');
  return () => {
    if ($queryCache.has($cacheEntry)) return $queryCache.get($cacheEntry);

    const entities: Entity[] = [];
    for (let i = 0; i < MAX_ENTITIES; i++) {
      if (!$entityStore[i]) continue;
      if (components.every((c) => (typeof c === 'function' ? c(i) : $entityStore[i].includes(c)))) entities.push(i);
    }

    $queryCache.set($cacheEntry, entities);

    return entities;
  };
};

export const addEntity = () => {
  $queryCache.clear();
  for (let i = 0; i < MAX_ENTITIES; i++) {
    if ($entityStore[i] === null) {
      $entityStore[i] = [];
      return i;
    }
  }

  throw new Error('No more entities');
};

export const removeEntity = (entity: Entity) => {
  $queryCache.clear();
  $entityStore[entity] = null;
};

export const clearEntities = () => {
  $queryCache.clear();
  for (let i = 0; i < MAX_ENTITIES; i++) {
    $entityStore[i] = null;
  }
};

export type SerializedData = [string, string, number | AllArrayTypes][];

export const serializeEntity = (entity: Entity): SerializedData => {
  const components = $entityStore[entity];

  const data: SerializedData = [['_entity', '_entity', entity]];

  for (const component of components) {
    const name = decodeName(component);
    for (const key in component) {
      if (key === '_name') continue;
      data.push([name, key, $componentStore[name][key][entity]]);
    }
  }

  return data;
};

export const deserializeEntity = (data: SerializedData) => {
  const eid = data[0][2] as number;

  for (const [name, key, value] of data.slice(1)) {
    if (value instanceof Array) {
      $componentStore[name][key][eid] = value[0];
    }
    $componentStore[name][key][eid] = value;
  }
  const uniqueComponents = [...new Set(data.slice(1).map(([name]) => name))];
  $entityStore[eid] = uniqueComponents;
};
