import {
  addComponent,
  addEntity,
  clearEntities,
  defineComponent,
  defineQuery,
  deserializeEntity,
  Not,
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
  beforeEach(() => {
    clearEntities();
  });
  it('should add an entity successfully', () => {
    const eid = addEntity();

    expect(eid).toEqual(0);
  });

  it('should add multiple entities successfully', () => {
    const eid1 = addEntity();
    const eid2 = addEntity();

    expect(eid1).toEqual(0);
    expect(eid2).toEqual(1);
  });

  it('should throw an error when no more entities are available', () => {
    for (let i = 0; i < 1000; i++) {
      addEntity();
    }

    expect(() => addEntity()).toThrowError('No more entities');
  });
});

describe('addComponent', () => {
  beforeEach(() => {
    clearEntities();
  });

  it('should add a component to an entity successfully', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const eid = addEntity();

    addComponent(eid, Position);

    Position.x[eid] = 10;
    Position.y[eid] = 20;
    Position.x[eid] += 10;

    expect(Position.x[eid]).toEqual(20);
  });
});

describe('removeComponent', () => {
  beforeEach(() => {
    clearEntities();
  });

  it('should remove a component from an entity successfully', () => {
    const Position = defineComponent('position', {
      x: Types.i32,
      y: Types.i32,
    });

    const eid = addEntity();

    addComponent(eid, Position);

    Position.x[eid] = 10;
    Position.y[eid] = 20;

    expect(Position.x[eid]).toEqual(10);
    expect(Position.y[eid]).toEqual(20);

    removeComponent(eid, Position);

    expect(Position.x[eid]).toEqual(0);
    expect(Position.y[eid]).toEqual(0);
  });
});

describe('query', () => {
  beforeEach(() => {
    clearEntities();
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

    const eid1 = addEntity();
    const eid2 = addEntity();

    addComponent(eid1, Position);
    addComponent(eid1, Velocity);

    addComponent(eid2, Position);

    const query = defineQuery(Position, Velocity);

    const entities = query();

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

    const eid1 = addEntity();
    const eid2 = addEntity();

    addComponent(eid1, Position);
    addComponent(eid1, Velocity);

    addComponent(eid2, Position);

    const query = defineQuery(Position);

    const entities = query();

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

    const eid1 = addEntity();
    const eid2 = addEntity();

    addComponent(eid1, Position);
    addComponent(eid1, Velocity);

    addComponent(eid2, Position);

    const query = defineQuery(Not(Velocity));

    const entities = query();

    expect(entities).toEqual([eid2]);
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

    const eid1 = addEntity();
    const eid2 = addEntity();

    addComponent(eid1, Position);
    addComponent(eid1, Velocity);

    addComponent(eid2, Position);

    const query = defineQuery(Position, Not(Velocity));

    const entities = query();

    expect(entities).toEqual([eid2]);
  });
});

describe('serializeEntity', () => {
  beforeEach(() => {
    clearEntities();
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

    const eid = addEntity();

    addComponent(eid, Position);
    addComponent(eid, Velocity);

    Position.x[eid] = 10;
    Position.y[eid] = 20;

    Velocity.x[eid] = 2;
    Velocity.y[eid] = 255;

    const serialized = serializeEntity(eid);

    expect(serialized).toEqual([
      ['_entity', '_entity', 0],
      ['position', 'x', 10],
      ['position', 'y', 20],
      ['velocity', 'x', 2],
      ['velocity', 'y', 255],
    ]);

    Velocity.x[eid] = 20;

    deserializeEntity(serialized);

    expect(Velocity.x[eid]).toEqual(2);
  });
});
