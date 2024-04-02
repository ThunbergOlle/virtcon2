import { EntityId, getEntityCount } from './entity';
import { $entityStore, ComponentStore, STORE } from './store';

export const defineQuery = <K>(...components: ComponentStore<K>[]): { (): number[]; $latestEntities: number[] } => {
  const query = function () {
    const entityResponse: EntityId[] = [];
    for (let eid = 0; eid < getEntityCount(); eid++) {
      let include = true;
      const componentsOnEntity = STORE[$entityStore][eid];
      for (let i = 0; i < components.length; i++) {
        if (!componentsOnEntity.includes(components[i].identifier)) {
          include = false;
          break;
        }
      }
      if (include) {
        entityResponse.push(eid);
      }
    }

    query.$latestEntities = entityResponse;
    return entityResponse;
  };

  query.$latestEntities = [] as number[];

  return query;
};

export const enterQuery = (query: ReturnType<typeof defineQuery>) => {
  const previousEntities = query.$latestEntities;
  const result = query();
  return result.filter((eid) => !previousEntities.includes(eid));
};
