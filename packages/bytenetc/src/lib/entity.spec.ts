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
  deserializeEntity,
  enterQuery,
  exitQuery,
  Not,
  registerComponents,
  removeComponent,
  serializeEntity,
  Types,
} from './entity';

describe('defineComponent', () => {
  it('should define a component successfully', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    expect(Position._name).toEqual(new TextEncoder().encode('position'));
  });
});

describe('addEntity', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  it('should add an entity successfully', () => {
    const eid = addEntity(world);

    expect(eid).toEqual(0);
  });

  it('should add multiple entities successfully', () => {
    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    expect(eid1).toEqual(0);
    expect(eid2).toEqual(1);
  });

  it('should throw an error when no more entities are available', () => {
    for (let i = 0; i < 1000; i++) {
      addEntity(world);
    }

    expect(() => addEntity(world)).toThrowError('No more entities');
  });
});

describe('addComponent', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  it('should add a component to an entity successfully', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
      arrayTest: [Types.ui8, 10],
    });

    registerComponents(world, [Position]);

    const eid = addEntity(world);

    addComponent(world, Position, eid);

    Position.x[eid] = 10;
    Position.y[eid] = 20;
    Position.x[eid] += 10;

    Position.arrayTest[eid] = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(Position.x[eid]).toEqual(20);
  });
});

describe('removeComponent', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  it('should remove a component from an entity successfully', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    registerComponents(world, [Position]);

    const eid = addEntity(world);

    addComponent(world, Position, eid);

    Position.x[eid] = 10;
    Position.y[eid] = 20;

    expect(Position.x[eid]).toEqual(10);
    expect(Position.y[eid]).toEqual(20);

    removeComponent(world, Position, eid);

    expect(Position.x[eid]).toEqual(0);
    expect(Position.y[eid]).toEqual(0);
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

    Position.x[eid1] = 10;
    Position.y[eid1] = 20;

    expect(query(world)).toEqual([eid1]);

    addComponent(world, Position, eid2);

    Position.x[eid2] = 20;
    Position.y[eid2] = 30;

    expect(query(world)).toEqual([eid2]);

    Position.x[eid2] = 10;
    Position.y[eid2] = 30;

    expect(query(world)).toEqual([eid2]);

    expect(query(world)).toEqual([]);
    expect(query(world)).toEqual([]);

    Position.x[eid2] = 20;
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

    Position.x[eid] = 10;
    Position.y[eid] = 20;

    Velocity.x[eid] = 2;
    Velocity.y[eid] = 255;

    const serialized = serializeEntity(world, eid);

    expect(serialized).toEqual([
      ['_entity', '_entity', 0],
      ['position', 'x', 10],
      ['position', 'y', 20],
      ['velocity', 'x', 2],
      ['velocity', 'y', 255],
    ]);

    Velocity.x[eid] = 20;

    deserializeEntity(world, serialized);

    expect(Velocity.x[eid]).toEqual(2);
  });

  it('should serialize an entity with an array successfully', () => {
    const Tag = defineComponent('tag', {
      value: [Types.ui8, 10],
    });
    registerComponents(world, [Tag]);

    const eid = addEntity(world);

    addComponent(world, Tag, eid);

    Tag.value[eid] = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const serialized = serializeEntity(world, eid);

    expect(serialized).toEqual([
      ['_entity', '_entity', 0],
      ['tag', 'value', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])],
    ]);

    Tag.value[eid] = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

    deserializeEntity(world, serialized);

    expect(Tag.value[eid]).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  });
});

describe('enter and exit queries', () => {
  const world = createWorld('test');

  beforeEach(() => {
    clearEntities(world);
  });

  it('should return entities that enter a query', () => {
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

    Position.x[eid] = 10;
    Position.y[eid] = 20;

    Velocity.x[eid] = 2;
    Velocity.y[eid] = 255;

    const serializePosition = defineSerializer([Position]);

    const serialized = serializePosition(world, [eid]);

    expect(serialized[0]).toEqual([
      ['_entity', '_entity', 0],
      ['position', 'x', 10],
      ['position', 'y', 20],
    ]);

    const deserializePosition = defineDeserializer([Position]);

    Position.x[eid] = 20;
    Position.y[eid] = 30;
    Velocity.x[eid] = 10;

    deserializePosition(world, serialized);

    expect(Position.x[eid]).toEqual(10);
    expect(Position.y[eid]).toEqual(20);
    expect(Velocity.x[eid]).toEqual(10);
  });

  it('should serialize an entity with an array successfully', () => {
    const encoder = new TextEncoder();

    const Tag = defineComponent('tag', {
      value: [Types.ui8, 10],
    });
    registerComponents(world, [Tag]);

    const eid = addEntity(world);

    addComponent(world, Tag, eid);

    Tag.value[eid] = encoder.encode('test');

    const serializeTag = defineSerializer([Tag]);

    const serialized = serializeTag(world, [eid]);

    expect(serialized[0]).toEqual([
      ['_entity', '_entity', 0],
      ['tag', 'value', new Uint8Array([116, 101, 115, 116])],
    ]);

    Tag.value[eid] = encoder.encode('test2');

    const deserializeTag = defineDeserializer([Tag]);

    deserializeTag(world, serialized);

    expect(Tag.value[eid]).toEqual(encoder.encode('test'));
  });
});
