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

type Type = (typeof Types)[keyof typeof Types];
type ArrayType = [Type, number];
type Schema = Record<string, Type | ArrayType>;

type AllArrayTypes = Int8Array | Int16Array | Int32Array | Float32Array | Float64Array | Uint8Array | Uint16Array | Uint32Array;

type TypeToTypedArray<T extends Type> = T extends 'i8'
  ? Int8Array
  : T extends 'i16'
  ? Int16Array
  : T extends 'i32'
  ? Int32Array
  : T extends 'f32'
  ? Float32Array
  : T extends 'f64'
  ? Float64Array
  : T extends 'ui8'
  ? Uint8Array
  : T extends 'ui16'
  ? Uint16Array
  : T extends 'ui32'
  ? Uint32Array
  : never;

export type Component<S extends Schema> = SchemaToComponent<S> & { _name: Uint8Array; _schema: S };

type SchemaToComponent<S extends Schema> = {
  [K in keyof S]: S[K] extends Type ? TypeToTypedArray<S[K]> : S[K] extends ArrayType ? Array<TypeToTypedArray<S[K][0]>> : never;
};

type ComponentStore = Record<string, Component<any>>;

export type World = string;

type WorldStore = {
  $entityStore: Array<string[]>;
  $componentStore: ComponentStore;
  $queryCache: Map<any, any>;
};

const $store: { [key: World]: WorldStore } = {};

export const createWorld = (id: World) => {
  $store[id] = {
    $entityStore: new Array(MAX_ENTITIES).fill(null),
    $componentStore: {},
    $queryCache: new Map(),
  };
  return id;
};

export const deleteWorld = (id: World) => {
  delete $store[id];
};

const decodeName = (c: Component<any>) => new TextDecoder().decode(c._name as Uint8Array);

const chooseArray = <T extends Type>(type: T, length: number): TypeToTypedArray<T> => {
  switch (type) {
    case Types.i8:
      return new Int8Array(length) as TypeToTypedArray<T>;
    case Types.i16:
      return new Int16Array(length) as TypeToTypedArray<T>;
    case Types.i32:
      return new Int32Array(length) as TypeToTypedArray<T>;
    case Types.f32:
      return new Float32Array(length) as TypeToTypedArray<T>;
    case Types.f64:
      return new Float64Array(length) as TypeToTypedArray<T>;
    case Types.ui8:
      return new Uint8Array(length) as TypeToTypedArray<T>;
    case Types.ui16:
      return new Uint16Array(length) as TypeToTypedArray<T>;
    case Types.ui32:
      return new Uint32Array(length) as TypeToTypedArray<T>;
    default:
      throw new Error(`Invalid type ${type}`);
  }
};

export const defineComponent = <S extends Schema>(name: string, schema: S): Component<S> => {
  const nameUint8 = new TextEncoder().encode(name);

  const component: any = {
    _name: nameUint8,
    _schema: schema,
  };

  for (const key in schema) {
    if (schema[key] instanceof Array) {
      const [type, length] = schema[key] as ArrayType;

      const array = chooseArray(type, length);
      component[key] = new Array(MAX_ENTITIES).fill(array);
      continue;
    }

    const array = chooseArray(schema[key] as Type, MAX_ENTITIES);
    component[key] = array;
  }

  return component;
};

export const registerComponents = (world: World, components: Component<any>[]) => {
  for (const component of components) {
    const name = decodeName(component);
    $store[world].$componentStore[name] = component;
  }
};

export const addComponent = (world: World, component: Component<any>, entity: Entity) => {
  const name = decodeName(component);
  if (!$store[world].$componentStore[name]) {
    throw new Error(`Component ${name} does not exist`);
  }

  $store[world].$entityStore[entity].push(decodeName(component));

  $store[world].$queryCache.clear();
};

export const removeComponent = (world: World, component: Component<any>, entity: Entity) => {
  const name = decodeName(component);
  if (!$store[world].$componentStore[name]) {
    throw new Error(`Component ${name} does not exist`);
  }

  $store[world].$entityStore[entity] = $store[world].$entityStore[entity].filter((c) => c !== name);

  for (const keyName in $store[world].$componentStore[name]) {
    $store[world].$componentStore[name][keyName][entity] = 0;
  }

  $store[world].$queryCache.clear();
};

export type QueryModifier = { (entity: Entity, world: World): boolean; noCache?: boolean };

export const Not =
  (component: Component<any>): QueryModifier =>
  (entityId: Entity, world: World) =>
    !$store[world].$entityStore[entityId].includes(decodeName(component));

export const Has =
  (component: Component<any>): QueryModifier =>
  (entityId: Entity, world: World) =>
    $store[world].$entityStore[entityId].includes(decodeName(component));

export const Changed = (component: Component<any>): QueryModifier => {
  const $changedCache = new Map<Entity, unknown[]>();

  const modifier: QueryModifier = (entityId: Entity, world: World) => {
    if (!Has(component)(entityId, world)) return false;

    const name = decodeName(component);
    const components = $store[world].$componentStore[name];
    const values = [];
    for (const key in components) {
      if (key === '_name') continue;
      values.push(components[key][entityId]);
    }

    if (!$changedCache.has(entityId)) {
      $changedCache.set(entityId, values);
      return true;
    }

    const prevValues = $changedCache.get(entityId);
    const changed = !values.every((v, i) => v === prevValues[i]);

    if (changed) $changedCache.set(entityId, values);

    return changed;
  };

  modifier.noCache = true;

  return modifier;
};

type QueryReturn = (world: World) => Entity[];
export const defineQuery = (...components: (Component<any> | QueryModifier)[]): QueryReturn => {
  const $cacheEntry = Symbol('queryCache');

  const useCache = components.every((c) => typeof c !== 'function' && !c.noCache);

  return (world: World): Entity[] => {
    if (useCache && $store[world].$queryCache.has($cacheEntry)) return $store[world].$queryCache.get($cacheEntry);

    const entities: Entity[] = [];
    for (let i = 0; i < MAX_ENTITIES; i++) {
      if (!$store[world].$entityStore[i]) continue;
      if (
        components.every((componentOrModifier) =>
          typeof componentOrModifier === 'function' ? componentOrModifier(i, world) : Has(componentOrModifier)(i, world),
        )
      )
        entities.push(i);
    }

    $store[world].$queryCache.set($cacheEntry, entities);

    return entities;
  };
};

export const enterQuery = (query: QueryReturn) => {
  let prevResult = [];
  return (world: World) => {
    const entities = query(world);

    const newEntities = entities.filter((e) => !prevResult.includes(e));

    prevResult = entities;

    return newEntities;
  };
};

export const exitQuery = (query: QueryReturn) => {
  let prevResult = [];
  return (world: World) => {
    const entities = query(world);

    const removedEntities = prevResult.filter((e) => !entities.includes(e));

    prevResult = entities;

    return removedEntities;
  };
};

export const addEntity = (world: World) => {
  $store[world].$queryCache.clear();
  for (let i = 0; i < MAX_ENTITIES; i++) {
    if ($store[world].$entityStore[i] === null) {
      $store[world].$entityStore[i] = [];
      return i;
    }
  }

  throw new Error('No more entities');
};

export const addReservedEntity = (world: World, entity: Entity) => {
  if ($store[world].$entityStore[entity]) throw new Error(`Cannot reserve entity ${entity}, already exists`);
  $store[world].$queryCache.clear();
  $store[world].$entityStore[entity] = [];
  return entity;
};

export const dangerouslyAddEntity = (world: World, entity: Entity) => {
  $store[world].$queryCache.clear();
  $store[world].$entityStore[entity] = [];
};

export const removeEntity = (world: World, entity: Entity) => {
  $store[world].$queryCache.clear();
  $store[world].$entityStore[entity] = null;

  for (const name in $store[world].$componentStore) {
    const schema = $store[world].$componentStore[name]._schema;

    for (const key in schema) {
      if (key === '_name') continue;
      if (key === '_schema') continue;

      if (schema[key] instanceof Array) {
        const [type, length] = schema[key] as ArrayType;
        const array = chooseArray(type, length);
        $store[world].$componentStore[name][key][entity] = array;
      } else {
        $store[world].$componentStore[name][key][entity] = 0;
      }
    }
  }

  return entity;
};

export const clearEntities = (world: World) => {
  $store[world].$queryCache.clear();
  for (let i = 0; i < MAX_ENTITIES; i++) {
    $store[world].$entityStore[i] = null;
  }
};

export type SerializedData = [string, string, number | AllArrayTypes][];

export const serializeEntity = (world: World, entity: Entity): SerializedData => {
  const components = $store[world].$entityStore[entity];

  const data: SerializedData = [['_entity', '_entity', entity]];

  for (const name of components) {
    for (const key in $store[world].$componentStore[name]) {
      if (key === '_name' || key === '_schema') continue;
      data.push([name, key, $store[world].$componentStore[name][key][entity]]);
    }
  }

  return data;
};

const deserializeArray = (world: World, name: string, key: string, value: AllArrayTypes, eid: Entity) => {
  const deserializeInto = $store[world].$componentStore[name][key][eid];
  if (deserializeInto instanceof Uint8Array) $store[world].$componentStore[name][key][eid] = new Uint8Array(value as Uint8Array);
  else if (deserializeInto instanceof Uint16Array) $store[world].$componentStore[name][key][eid] = new Uint16Array(value as Uint16Array);
  else if (deserializeInto instanceof Uint32Array) $store[world].$componentStore[name][key][eid] = new Uint32Array(value as Uint32Array);
  else if (deserializeInto instanceof Int8Array) $store[world].$componentStore[name][key][eid] = new Int8Array(value as Int8Array);
  else if (deserializeInto instanceof Int16Array) $store[world].$componentStore[name][key][eid] = new Int16Array(value as Int16Array);
  else if (deserializeInto instanceof Int32Array) $store[world].$componentStore[name][key][eid] = new Int32Array(value as Int32Array);
  else if (deserializeInto instanceof Float32Array) $store[world].$componentStore[name][key][eid] = new Float32Array(value as Float32Array);
  else if (deserializeInto instanceof Float64Array) $store[world].$componentStore[name][key][eid] = new Float64Array(value as Float64Array);
  else throw new Error(`Invalid array type for ${name}.${key}, type: ${deserializeInto.constructor.name}`);
};

export const deserializeEntity = (world: World, data: SerializedData) => {
  const eid = data[0][2] as number;

  for (const [name, key, value] of data.slice(1)) {
    if (value instanceof Array) deserializeArray(world, name, key, value as AllArrayTypes, eid);
    else $store[world].$componentStore[name][key][eid] = value;
  }

  const uniqueComponents = [...new Set(data.slice(1).map(([name]) => name))];
  $store[world].$entityStore[eid] = uniqueComponents;

  $store[world].$queryCache.clear();

  return eid;
};

export const defineSerializer = (components: Component<any>[]) => {
  return (world: World, entities: Entity[]) => {
    const data: SerializedData[] = [];
    for (const entity of entities) {
      const serializedData: SerializedData = [['_entity', '_entity', entity]];

      for (const component of components) {
        const componentName = decodeName(component);
        if (!$store[world].$entityStore[entity].includes(componentName)) continue;

        for (const key in $store[world].$componentStore[componentName]) {
          if (key === '_name') continue;
          if (key === '_schema') continue;
          const value = $store[world].$componentStore[componentName][key][entity];
          serializedData.push([componentName, key, value]);
        }
      }

      data.push(serializedData);
    }

    return data;
  };
};

export const defineDeserializer = (components: Component<any>[]) => {
  return (world: World, data: SerializedData[]) => {
    const deserializedEnts = [];
    for (const entity of data) {
      const eid = entity[0][2] as number;
      if (!$store[world].$entityStore[eid]) dangerouslyAddEntity(world, eid);

      for (const [name, key, value] of entity.slice(1)) {
        if (!components.some((c) => decodeName(c) === name)) continue;

        if (value instanceof Array) deserializeArray(world, name, key, value as AllArrayTypes, eid);
        else $store[world].$componentStore[name][key][eid] = value;
        if (!$store[world].$entityStore[eid].includes(name)) {
          $store[world].$entityStore[eid].push(name);
        }
      }

      deserializedEnts.push(eid);
    }

    $store[world].$queryCache.clear();

    return deserializedEnts;
  };
};

export type System<State> = (state: State) => State;

export const defineSystem = <State>(system: System<State>) => system;

export const debugEntity = (world: World, entity: Entity) => ({
  components: $store[world].$entityStore[entity],
  componentData: $store[world].$entityStore[entity].map((name) => {
    const c = $store[world].$componentStore[name];
    const data = {};
    for (const key in c) {
      if (key === '_name') continue;
      data[key] = c[key][entity];
    }

    return { [name]: data };
  }),
  entityId: entity,
});

export const serializeAllEntities = (world: World) => {
  const data: SerializedData[] = [];
  for (let i = 0; i < MAX_ENTITIES; i++) {
    if (!$store[world].$entityStore[i]) continue;
    data.push(serializeEntity(world, i));
  }

  return data;
};

export const doesEntityExist = (world: World, entity: Entity) => !!$store[world].$entityStore[entity];
