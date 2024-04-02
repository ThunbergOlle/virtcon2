import { createEntity, removeEntity } from './entity';
describe('ecsNet', () => {
  it('should add an entity', () => {
    const entity = createEntity();
    expect(entity).toBe(0);
  });

  it('should remove an entity', () => {
    const entity = createEntity();
    expect(entity).toBe(1);
    removeEntity(entity);
    const reUsedEntity = createEntity();
    expect(entity).toBe(1);
    expect(reUsedEntity).toBe(1);
  });
});
