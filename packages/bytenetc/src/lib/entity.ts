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

export type Component<S extends Schema> = SchemaToComponent<S> & { _name: Uint8Array };

type SchemaToComponent<S extends Schema> = {
  [K in keyof S]: S[K] extends Type ? TypeToTypedArray<S[K]> : S[K] extends ArrayType ? Array<TypeToTypedArray<S[K][0]>> : never;
};

type ComponentStore = Record<string, Component<any>>;

type World = string;
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
    throw new Error(`Component ${component} does not exist`);
  }

  $store[world].$entityStore[entity].push(decodeName(component));

  $store[world].$queryCache.clear();
};

export const removeComponent = (world: World, component: Component<any>, entity: Entity) => {
  const name = decodeName(component);
  if (!$store[world].$componentStore[name]) {
    throw new Error(`Component ${component} does not exist`);
  }

  $store[world].$entityStore[entity] = $store[world].$entityStore[entity].filter((c) => c !== name);

  for (const keyName in $store[world].$componentStore[name]) {
    $store[world].$componentStore[name][keyName][entity] = 0;
  }

  $store[world].$queryCache.clear();
};

export type QueryModifier = (entity: Entity, world: World) => boolean;

export const Not =
  (component: Component<any>): QueryModifier =>
  (entityId: Entity, world: World) =>
    !$store[world].$entityStore[entityId].includes(decodeName(component));

export const defineQuery = (...components: (Component<any> | QueryModifier)[]) => {
  const $cacheEntry = Symbol('queryCache');

  return (world: World) => {
    if ($store[world].$queryCache.has($cacheEntry)) return $store[world].$queryCache.get($cacheEntry);

    const entities: Entity[] = [];
    for (let i = 0; i < MAX_ENTITIES; i++) {
      if (!$store[world].$entityStore[i]) continue;
      if (components.every((c) => (typeof c === 'function' ? c(i, world) : $store[world].$entityStore[i].includes(decodeName(c))))) entities.push(i);
    }

    $store[world].$queryCache.set($cacheEntry, entities);

    return entities;
  };
};

export const enterQuery = (query: ReturnType<ReturnType<typeof defineQuery>>) => {
  let prevResult = [];
  return (world: World) => {
    const entities = query(world);

    const newEntities = entities.filter((e) => !prevResult.includes(e));

    prevResult = entities;

    return newEntities;
  };
};

export const exitQuery = (query: ReturnType<ReturnType<typeof defineQuery>>) => {
  let prevResult = [];
  return () => {
    const entities = query();

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

export const removeEntity = (world: World, entity: Entity) => {
  $store[world].$queryCache.clear();
  $store[world].$entityStore[entity] = null;
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
      if (key === '_name') continue;
      data.push([name, key, $store[world].$componentStore[name][key][entity]]);
    }
  }

  return data;
};

export const deserializeEntity = (world: World, data: SerializedData) => {
  const eid = data[0][2] as number;

  for (const [name, key, value] of data.slice(1)) {
    $store[world].$componentStore[name][key][eid] = value as number;
  }
  const uniqueComponents = [...new Set(data.slice(1).map(([name]) => name))];
  $store[world].$entityStore[eid] = uniqueComponents;
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
          serializedData.push([componentName, key, $store[world].$componentStore[componentName][key][entity]]);
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

      for (const [name, key, value] of entity.slice(1)) {
        if (!components.some((c) => decodeName(c) === name)) continue;
        $store[world].$componentStore[name][key][eid] = value as number;
        if (!$store[world].$entityStore[eid].includes(name)) {
          $store[world].$entityStore[eid].push(name);
        }
      }

      deserializedEnts.push(eid);
    }
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
});

export const serializeAllEntities = (world: World) => {
  const data: SerializedData[] = [];
  for (let i = 0; i < MAX_ENTITIES; i++) {
    if (!$store[world].$entityStore[i]) continue;
    data.push(serializeEntity(world, i));
  }

  return data;
};
