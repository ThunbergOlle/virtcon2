import { $entityStore, STORE } from './store';

export const MAX_ENTITY_AMOUNT = 512;

const entitySlots = new Array(MAX_ENTITY_AMOUNT).fill(0);
let entityCount = 0;

export const getEntityCount = () => {
  return entityCount;
};

export type EntityId = number;
export const createEntity = (): EntityId => {
  const eid = entitySlots.findIndex((slot) => slot === 0);
  if (eid === -1) throw new Error('No more entities available');
  entitySlots[eid] = 1;
  STORE[$entityStore][eid] = [];
  entityCount++;

  return eid;
};

export const removeEntity = (eid: EntityId) => {
  STORE[$entityStore][eid] = null;
  entityCount--;
  entitySlots[eid] = 0;
};

export const clearEntities = () => {
  for (let i = 0; i < entitySlots.length; i++) {
    if (entitySlots[i] === 1) {
      removeEntity(i);
    }
  }
};
