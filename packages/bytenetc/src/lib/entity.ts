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

type EntityStore = Record<string, Component<any>>;

const $componentStore: EntityStore = {};

const $entityStore = new Array<string[]>(MAX_ENTITIES).fill(null);
const $queryCache = new Map();

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

  $componentStore[name] = component;

  return $componentStore[name];
};

export const addComponent = (component: Component<any>, entity: Entity) => {
  if (!$componentStore[decodeName(component)]) {
    throw new Error(`Component ${component} does not exist`);
  }

  $entityStore[entity].push(decodeName(component));

  $queryCache.clear();
};

export const removeComponent = (component: Component<any>, entity: Entity) => {
  const name = decodeName(component);
  if (!$componentStore[name]) {
    throw new Error(`Component ${component} does not exist`);
  }

  $entityStore[entity] = $entityStore[entity].filter((c) => c !== name);

  for (const keyName in $componentStore[name]) {
    $componentStore[name][keyName][entity] = 0;
  }

  $queryCache.clear();
};

export type QueryModifier = (entity: Entity) => boolean;

export const Not =
  (component: Component<any>): QueryModifier =>
  (entityId: Entity) =>
    !$entityStore[entityId].includes(decodeName(component));

export const defineQuery = (...components: (Component<any> | QueryModifier)[]) => {
  const $cacheEntry = Symbol('queryCache');

  return () => {
    if ($queryCache.has($cacheEntry)) return $queryCache.get($cacheEntry);

    const entities: Entity[] = [];
    for (let i = 0; i < MAX_ENTITIES; i++) {
      if (!$entityStore[i]) continue;
      if (components.every((c) => (typeof c === 'function' ? c(i) : $entityStore[i].includes(decodeName(c))))) entities.push(i);
    }

    $queryCache.set($cacheEntry, entities);

    return entities;
  };
};

export const enterQuery = (query: ReturnType<ReturnType<typeof defineQuery>>) => {
  let prevResult = [];
  return () => {
    const entities = query();

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

  for (const name of components) {
    for (const key in $componentStore[name]) {
      if (key === '_name') continue;
      data.push([name, key, $componentStore[name][key][entity]]);
    }
  }

  return data;
};

export const deserializeEntity = (data: SerializedData) => {
  const eid = data[0][2] as number;

  for (const [name, key, value] of data.slice(1)) {
    $componentStore[name][key][eid] = value as number;
  }
  const uniqueComponents = [...new Set(data.slice(1).map(([name]) => name))];
  $entityStore[eid] = uniqueComponents;
};

export const defineSerializer = (components: Component<any>[]) => {
  return (entities: Entity[]) => {
    const data: SerializedData[] = [];
    for (const entity of entities) {
      const serializedData: SerializedData = [['_entity', '_entity', entity]];

      for (const component of components) {
        const componentName = decodeName(component);
        if (!$entityStore[entity].includes(componentName)) continue;

        for (const key in $componentStore[componentName]) {
          if (key === '_name') continue;
          serializedData.push([componentName, key, $componentStore[componentName][key][entity]]);
        }
      }

      data.push(serializedData);
    }

    return data;
  };
};

export const defineDeserializer = (components: Component<any>[]) => {
  return (data: SerializedData[]) => {
    const deserializedEnts = [];
    for (const entity of data) {
      const eid = entity[0][2] as number;

      for (const [name, key, value] of entity.slice(1)) {
        if (!components.some((c) => decodeName(c) === name)) continue;
        $componentStore[name][key][eid] = value as number;
        if (!$entityStore[eid].includes(name)) {
          $entityStore[eid].push(name);
        }
      }

      deserializedEnts.push(eid);
    }
    return deserializedEnts;
  };
};

export type System<State> = (state: State) => State;

export const defineSystem = <State>(system: System<State>) => system;

export const debugEntity = (entity: Entity) => ({
  components: $entityStore[entity],
  componentData: $entityStore[entity].map((name) => {
    const c = $componentStore[name];
    const data = {};
    for (const key in c) {
      if (key === '_name') continue;
      data[key] = c[key][entity];
    }

    return { [name]: data };
  }),
});

export const serializeAllEntities = () => {
  const data: SerializedData[] = [];
  for (let i = 0; i < MAX_ENTITIES; i++) {
    if (!$entityStore[i]) continue;
    data.push(serializeEntity(i));
  }

  return data;
};
