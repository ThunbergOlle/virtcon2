import { EntityId } from './entity';
import { $entityStore, ComponentStore, createComponentStore, STORE } from './store';
import { ComponentType } from './types';

export type ComponentSchema<K> = {
  [key in keyof K]: ComponentType;
};

export const defineComponent = <K>(identifier: string, schema: ComponentSchema<K>): ComponentStore<K> => {
  return createComponentStore(identifier, schema);
};

/* addComponent(velocity) */
export const addComponent = (component: ReturnType<typeof defineComponent>, eid: EntityId) => {
  STORE[$entityStore][eid].push(component.identifier);
};

/* removeComponent(velocity) */
export const removeComponent = (component: ReturnType<typeof defineComponent>, eid: EntityId) => {
  const entity = STORE[$entityStore][eid];
  const index = entity.indexOf(component.identifier);
  if (index > -1) {
    entity.splice(index, 1);
  }
};
