import { addComponent, defineComponent } from './component';
import { clearEntities, createEntity } from './entity';
import { defineQuery } from './query';
import * as Types from './types';

const Position = defineComponent('position', {
  x: Types.ui8,
  y: Types.ui8,
});

const Velocity = defineComponent('velocity', {
  x: Types.ui8,
  y: Types.ui8,
});

describe('test querying entities', () => {
  beforeEach(() => {
    clearEntities();
  });
  it('it should not anything when there are no entities', () => {
    const query = defineQuery();
    expect(query()).toEqual([]);
  });

  it('it should return all entities with a component', () => {
    const query = defineQuery(Position);
    const entity1 = createEntity();

    addComponent(Position, entity1);

    createEntity();

    expect(query()).toEqual([entity1]);
  });

  it('it should return all entities with multiple components', () => {
    const positionQuery = defineQuery(Position);
    const velocityQuery = defineQuery(Velocity);

    const entity1 = createEntity();

    addComponent(Position, entity1);
    addComponent(Velocity, entity1);

    const entity2 = createEntity();
    addComponent(Position, entity2);

    expect(positionQuery()).toEqual([entity1, entity2]);
    expect(velocityQuery()).toEqual([entity1]);
  });

  it('should be able to define 500 entities', () => {
    const query = defineQuery(Position);
    for (let i = 0; i < 500; i++) {
      const entity = createEntity();
      addComponent(Position, entity);
      addComponent(Velocity, entity);
    }

    expect(query().length).toBe(500);
  });
});
