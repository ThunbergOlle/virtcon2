import {
  addComponent,
  addEntity,
  Changed,
  clearEntities,
  createWorld,
  defineComponent,
  defineDeserializer,
  defineQuery,
  defineSerializer,
  deleteWorld,
  deserializeEntity,
  doesEntityExist,
  enterQuery,
  exitQuery,
  Not,
  registerComponents,
  removeComponent,
  removeEntity,
  serializeEntity,
  Types,
} from './entity';

describe('defineComponent', () => {
  test('a user can define a component successfully', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    expect(Position.original._name).toEqual(new TextEncoder().encode('position'));
  });
});

describe('addEntity', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  test('adds an entity', () => {
    const eid = addEntity(world);

    expect(eid).toEqual(0);
  });

  test('add multiple entities', () => {
    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    expect(eid1).toEqual(0);
    expect(eid2).toEqual(1);
  });

  test('throw an error when no more entities are available', () => {
    for (let i = 0; i < 3000; i++) {
      addEntity(world);
    }

    expect(() => addEntity(world)).toThrowError('No more entities');
  });

  test("don't share array property references between entities", () => {
    const world = createWorld('test');

    const Vector = defineComponent('vector', {
      value: [Types.i16, 3],
    });
    registerComponents(world, [Vector]);

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    addComponent(world, Vector, eid1);
    addComponent(world, Vector, eid2);

    Vector(world).value[eid1][0] = 100;
    Vector(world).value[eid1][1] = 200;

    expect(Vector(world).value[eid1][0]).toBe(100);
    expect(Vector(world).value[eid2][0]).toBe(0);
    expect(Vector(world).value[eid2][1]).toBe(0);
  });
});

describe('removeEntity', () => {
  let world = createWorld('test');

  beforeEach(() => {
    deleteWorld(world);
    world = createWorld('test');
  });

  test('completely clean up an entity', () => {
    const Position = defineComponent('position', { x: Types.f32 });
    const Data = defineComponent('data', { buffer: [Types.ui8, 2] });
    registerComponents(world, [Position, Data]);

    const eid = addEntity(world);

    addComponent(world, Position, eid);
    addComponent(world, Data, eid);

    Position(world).x[eid] = 99;
    Data(world).buffer[eid] = new Uint8Array([1, 1]);

    removeEntity(world, eid);

    expect(doesEntityExist(world, eid)).toBe(false);

    // Now, reuse the same entity ID
    const newEid = addEntity(world);
    expect(newEid).toBe(eid); // Expect to reuse the lowest available ID

    expect(doesEntityExist(world, newEid)).toBe(true);
    const query = defineQuery(Position);
    expect(query(world)).not.toContain(newEid);
    expect(Position(world).x[newEid]).toBe(0);
    expect(Data(world).buffer[newEid]).toEqual(new Uint8Array([0, 0]));
  });
});

describe('addComponent', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  test('add a component to an entity', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
      arrayTest: [Types.ui8, 10],
    });

    registerComponents(world, [Position]);

    const eid = addEntity(world);

    addComponent(world, Position, eid);

    Position(world).x[eid] = 10;
    Position(world).y[eid] = 20;
    Position(world).x[eid] += 10;

    Position(world).arrayTest[eid] = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(Position(world).x[eid]).toEqual(20);
  });
});

describe('removeComponent', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  test('should remove a component from an entity successfully', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position]);

    const eid = addEntity(world);

    addComponent(world, Position, eid);

    Position(world).x[eid] = 10;
    Position(world).y[eid] = 20;

    expect(Position(world).x[eid]).toEqual(10);
    expect(Position(world).y[eid]).toEqual(20);

    removeComponent(world, Position, eid);

    expect(Position(world).x[eid]).toEqual(0);
    expect(Position(world).y[eid]).toEqual(0);
  });

  test('correctly reset array properties', () => {
    // This test targets the bug where array properties were set to `0` instead of a new array.
    const Data = defineComponent('data', {
      buffer: [Types.ui8, 4],
    });
    registerComponents(world, [Data]);
    const eid = addEntity(world);
    addComponent(world, Data, eid);

    Data(world).buffer[eid] = new Uint8Array([1, 2, 3, 4]);
    expect(Data(world).buffer[eid]).toEqual(new Uint8Array([1, 2, 3, 4]));

    removeComponent(world, Data, eid);

    // After removal, the property should be a zeroed-out array of the same type and length, NOT the number 0.
    expect(Data(world).buffer[eid]).not.toBe(0);
    expect(Data(world).buffer[eid]).toBeInstanceOf(Uint8Array);
    expect(Data(world).buffer[eid]).toEqual(new Uint8Array([0, 0, 0, 0]));
  });
});

describe('query', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  it('should return entities with all components', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const Velocity = defineComponent('velocity', {
      x: Types.i32,
      y: Types.i32,
    });
    registerComponents(world, [Position, Velocity]);

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    addComponent(world, Position, eid1);
    addComponent(world, Velocity, eid1);

    addComponent(world, Position, eid2);

    const query = defineQuery(Position, Velocity);

    const entities = query(world);

    expect(entities).toEqual([eid1]);
  });

  it('should return entities with one component', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const Velocity = defineComponent('velocity', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position, Velocity]);

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    addComponent(world, Position, eid1);
    addComponent(world, Velocity, eid1);

    addComponent(world, Position, eid2);

    const query = defineQuery(Position);

    const entities = query(world);

    expect(entities).toEqual([eid1, eid2]);
  });
  it('should return entities without a component', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const Velocity = defineComponent('velocity', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position, Velocity]);

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    addComponent(world, Position, eid1);
    addComponent(world, Velocity, eid1);

    addComponent(world, Position, eid2);

    const query = defineQuery(Not(Velocity));

    const entities = query(world);

    expect(entities).toEqual([eid2]);
  });

  it('should return entities with a component which has changed values', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position]);

    const query = defineQuery(Changed(Position));

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    addComponent(world, Position, eid1);

    Position(world).x[eid1] = 10;
    Position(world).y[eid1] = 20;

    expect(query(world)).toEqual([eid1]);

    addComponent(world, Position, eid2);

    Position(world).x[eid2] = 20;
    Position(world).y[eid2] = 30;

    expect(query(world)).toEqual([eid2]);

    Position(world).x[eid2] = 10;
    Position(world).y[eid2] = 30;

    expect(query(world)).toEqual([eid2]);

    expect(query(world)).toEqual([]);
    expect(query(world)).toEqual([]);

    Position(world).x[eid2] = 20;
    expect(query(world)).toEqual([eid2]);
  });

  it('should return entities without a component and with a component', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const Velocity = defineComponent('velocity', {
      x: Types.i32,
      y: Types.i32,
    });

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    addComponent(world, Position, eid1);
    addComponent(world, Velocity, eid1);

    addComponent(world, Position, eid2);

    const query = defineQuery(Position, Not(Velocity));

    const entities = query(world);

    expect(entities).toEqual([eid2]);
  });
});

describe('serializeEntity', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  it('should serialize an entity successfully', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const Velocity = defineComponent('velocity', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position, Velocity]);

    const eid = addEntity(world);

    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);

    Position(world).x[eid] = 10;
    Position(world).y[eid] = 20;

    Velocity(world).x[eid] = 2;
    Velocity(world).y[eid] = 255;

    const serialized = serializeEntity(world, eid);

    expect(serialized).toEqual([
      ['_entity', '_entity', 0],
      ['position', 'x', 10],
      ['position', 'y', 20],
      ['velocity', 'x', 2],
      ['velocity', 'y', 255],
    ]);

    Velocity(world).x[eid] = 20;

    deserializeEntity(world, serialized);

    expect(Velocity(world).x[eid]).toEqual(2);
  });

  it('should serialize an entity with an array successfully', () => {
    const Tag = defineComponent('tag', {
      value: [Types.ui8, 10],
    });
    registerComponents(world, [Tag]);

    const eid = addEntity(world);

    addComponent(world, Tag, eid);

    Tag(world).value[eid] = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const serialized = serializeEntity(world, eid);

    expect(serialized).toEqual([
      ['_entity', '_entity', 0],
      ['tag', 'value', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])],
    ]);

    Tag(world).value[eid] = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

    deserializeEntity(world, serialized);

    expect(Tag(world).value[eid]).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  });
});

describe('enter and exit queries', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  test('return entities that enters a query', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const Velocity = defineComponent('velocity', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position, Velocity]);

    const query = defineQuery(Position, Velocity);
    const newPlayersEnterQuery = enterQuery(query);
    const newPlayersExitQuery = exitQuery(query);
    const gameLoop = () => ({
      enter: newPlayersEnterQuery(world),
      exit: newPlayersExitQuery(world),
      query: query(world),
    });

    let state = gameLoop();
    expect(state.enter).toEqual([]);
    expect(state.exit).toEqual([]);
    expect(state.query).toEqual([]);

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    addComponent(world, Position, eid1);
    addComponent(world, Velocity, eid1);

    addComponent(world, Position, eid2);

    state = gameLoop();
    expect(state.enter).toEqual([eid1]);
    expect(state.exit).toEqual([]);
    expect(state.query).toEqual([eid1]);

    state = gameLoop();
    expect(state.enter).toEqual([]);
    expect(state.exit).toEqual([]);
    expect(state.query).toEqual([eid1]);

    removeComponent(world, Velocity, eid1);

    state = gameLoop();
    expect(state.enter).toEqual([]);
    expect(state.exit).toEqual([eid1]);
    expect(state.query).toEqual([]);
  });

  test('return entities that enters a query, but doesnt query other stuff', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const Velocity = defineComponent('velocity', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position, Velocity]);

    const query = defineQuery(Position);
    const newPlayersEnterQuery = enterQuery(query);
    const gameLoop = () => ({
      enter: newPlayersEnterQuery(world),
    });

    let state = gameLoop();
    expect(state.enter).toEqual([]);

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    addComponent(world, Position, eid1);
    addComponent(world, Velocity, eid1);

    addComponent(world, Position, eid2);

    state = gameLoop();
    expect(state.enter).toEqual([eid1, eid2]);

    state = gameLoop();
    expect(state.enter).toEqual([]);

    removeComponent(world, Position, eid1);
    removeComponent(world, Position, eid2);

    state = gameLoop();
    expect(state.enter).toEqual([]);

    addComponent(world, Position, eid1);
    addComponent(world, Velocity, eid1);

    addComponent(world, Position, eid2);
    state = gameLoop();
    expect(state.enter).toEqual([eid1, eid2]);
  });

  test('correctly handle entity re-entry after component removal and addition', () => {
    const Player = defineComponent('player', { id: Types.i32 });
    registerComponents(world, [Player]);

    const playerQuery = defineQuery(Player);
    const enter = enterQuery(playerQuery);

    const eid = addEntity(world);
    addComponent(world, Player, eid);

    expect(enter(world)).toEqual([eid]);
    expect(enter(world)).toEqual([]);

    removeComponent(world, Player, eid);
    expect(enter(world)).toEqual([]);

    addComponent(world, Player, eid);

    expect(enter(world)).toEqual([eid]);
  });

  test('return recycles entities having been removed and re-added within the same tick', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position]);

    const query = defineQuery(Position);
    const enter = enterQuery(query);

    const eid1 = addEntity(world);
    addComponent(world, Position, eid1);

    expect(enter(world)).toEqual([eid1]);

    removeEntity(world, eid1);
    const eid2 = addEntity(world);
    addComponent(world, Position, eid2);

    expect(eid2).toEqual(eid1);
    expect(enter(world)).toEqual([eid2]);
    expect(enter(world)).toEqual([]);

    removeEntity(world, eid2);
    const eid3 = addEntity(world);
    addComponent(world, Position, eid3);

    const eid4 = addEntity(world);
    addComponent(world, Position, eid4);

    expect(eid3).toEqual(eid1);
    expect(enter(world)).toEqual([eid3, eid4]);
  });

  test('same entitiy id exits and enters within the same tick', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position]);

    const query = defineQuery(Position);
    const exit = exitQuery(query);

    const eid1 = addEntity(world);
    addComponent(world, Position, eid1);

    expect(exit(world)).toEqual([]);

    removeEntity(world, eid1);
    const eid2 = addEntity(world);
    addComponent(world, Position, eid2);

    expect(exit(world)).toEqual([eid1]);
  });
});

describe('deserialization', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  test('only deserialize components specified in the deserializer', () => {
    const Position = defineComponent('position', { x: Types.i32, y: Types.i32 });
    const Velocity = defineComponent('velocity', { dx: Types.i32, dy: Types.i32 });
    registerComponents(world, [Position, Velocity]);

    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);

    Position(world).x[eid] = 10;
    Position(world).y[eid] = 10;
    Velocity(world).dx[eid] = 1;
    Velocity(world).dy[eid] = 1;

    const serializePosition = defineSerializer([Position(world)]);
    const serializedData = serializePosition(world, [eid]);

    Position(world).x[eid] = 99;
    Position(world).y[eid] = 99;
    Velocity(world).dx[eid] = 50;
    Velocity(world).dy[eid] = 50;

    const deserializePosition = defineDeserializer([Position(world)]);
    deserializePosition(world, serializedData);

    expect(Position(world).x[eid]).toBe(10);
    expect(Position(world).y[eid]).toBe(10);
    expect(Velocity(world).dx[eid]).toBe(50); // This should remain unchanged
    expect(Velocity(world).dy[eid]).toBe(50); // This should remain unchanged
  });
});

describe('defineSerializer', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  it('should serialize only the component supplied to the function', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const Velocity = defineComponent('velocity', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position, Velocity]);

    const eid = addEntity(world);

    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);

    Position(world).x[eid] = 10;
    Position(world).y[eid] = 20;

    Velocity(world).x[eid] = 2;
    Velocity(world).y[eid] = 255;

    const serializePosition = defineSerializer([Position(world)]);

    const serialized = serializePosition(world, [eid]);

    expect(serialized[0]).toEqual([
      ['_entity', '_entity', 0],
      ['position', 'x', 10],
      ['position', 'y', 20],
    ]);

    const deserializePosition = defineDeserializer([Position(world)]);

    Position(world).x[eid] = 20;
    Position(world).y[eid] = 30;
    Velocity(world).x[eid] = 10;

    deserializePosition(world, serialized);

    expect(Position(world).x[eid]).toEqual(10);
    expect(Position(world).y[eid]).toEqual(20);
    expect(Velocity(world).x[eid]).toEqual(10);
  });

  it('should serialize an entity with an array successfully', () => {
    const encoder = new TextEncoder();

    const Tag = defineComponent('tag', {
      value: [Types.ui8, 10],
    });
    registerComponents(world, [Tag]);

    const eid = addEntity(world);

    addComponent(world, Tag, eid);

    Tag(world).value[eid] = encoder.encode('test');

    const serializeTag = defineSerializer([Tag(world)]);

    const serialized = serializeTag(world, [eid]);

    expect(serialized[0]).toEqual([
      ['_entity', '_entity', 0],
      ['tag', 'value', new Uint8Array([116, 101, 115, 116])],
    ]);

    Tag(world).value[eid] = encoder.encode('test2');

    const deserializeTag = defineDeserializer([Tag(world)]);

    deserializeTag(world, serialized);

    expect(Tag(world).value[eid]).toEqual(encoder.encode('test'));
  });
});

describe('Query modifications', () => {
  let world: string;

  beforeEach(() => {
    world = createWorld(`test_${Math.random()}`);
  });

  afterEach(() => {
    deleteWorld(world);
  });

  describe('Changed', () => {
    test('detect in-place mutations of array properties', () => {
      const PlayerData = defineComponent('playerData', {
        inventory: [Types.ui16, 5],
      });
      registerComponents(world, [PlayerData]);

      const query = defineQuery(Changed(PlayerData));
      const eid = addEntity(world);
      addComponent(world, PlayerData, eid);

      expect(query(world)).toEqual([eid]);
      expect(query(world)).toEqual([]);

      PlayerData(world).inventory[eid][0] = 99;

      expect(query(world)).toEqual([eid]);
    });

    test("don't detect a change if a value is set to itself", () => {
      const Stats = defineComponent('stats', { score: Types.i32 });
      registerComponents(world, [Stats]);

      const query = defineQuery(Changed(Stats));
      const eid = addEntity(world);
      addComponent(world, Stats, eid);
      Stats(world).score[eid] = 500;

      query(world);
      expect(query(world)).toEqual([]);

      Stats(world).score[eid] = 500;

      expect(query(world)).toEqual([]);
    });
  });
});
