import { createEntity } from './entity';
import { addComponent, defineComponent } from './component';
import * as Types from './types';

const Position = defineComponent('position', {
  x: Types.ui8,
  y: Types.ui8,
});

describe('component', () => {
  it('add a component to an entity', () => {
    const entity = createEntity();
    addComponent(Position, entity);
    expect(entity).toBe(0);

    Position.x[entity] = 20;
    Position.y[entity] = 20;
    Position.x[entity] += 10;
    expect(Position.x[entity]).toBe(30);
  });
});
