import { $entityStore, STORE } from './store';

export const MAX_ENTITY_AMOUNT = 512;

export type EntityId = number;
export const createEntity = (): EntityId => {
  const eid = STORE[$entityStore].findIndex((exists) => !exists);
  if (eid === -1) throw new Error('No more entities available');
  STORE[$entityStore][eid] = [];

  return eid;
};

export const removeEntity = (eid: EntityId) => {
  STORE[$entityStore][eid] = null;
};

export const clearEntities = () => {
  STORE[$entityStore].fill(null);
};
