import { defineQuery, defineSerializer, World } from '@virtcon2/bytenetc';
import { Animation, Building, getSerializeConfig, Inserter, Position, SerializationID } from '@virtcon2/network-world-entities';
import { syncServerEntities } from '../packet/enqueue';
import { defineSystem } from '@virtcon2/bytenetc';
import { SyncEntities } from './types';
import { INSERTER_ANIMATION_TICKS } from './inserterSystem';

export const createInserterAnimationSystem = (world: World) => {
  const inserterQuery = defineQuery(Inserter, Building, Position);

  return defineSystem<SyncEntities>(({ worldData, sync, removeEntities }) => {
    const inserterEntities = inserterQuery(world);
    if (inserterEntities.length === 0) {
      return { worldData, sync, removeEntities };
    }

    const changedEntities: number[] = [];

    for (const inserterEid of inserterEntities) {
      const direction = Inserter(world).direction[inserterEid];
      const progressTick = Inserter(world).progressTick[inserterEid];
      const enabled = Inserter(world).enabled[inserterEid];

      const prevAnimIndex = Animation(world).animationIndex[inserterEid];
      const prevIsPlaying = Animation(world).isPlaying[inserterEid];

      let animationIndex: number;
      let isPlaying: number;

      if (progressTick > 0 && progressTick < INSERTER_ANIMATION_TICKS) {
        // Active animation
        animationIndex = direction + 4;
        isPlaying = enabled; // 1 if progressing, 0 if paused
      } else {
        // Idle animation
        animationIndex = direction;
        isPlaying = 1;
      }

      if (animationIndex !== prevAnimIndex || isPlaying !== prevIsPlaying) {
        Animation(world).animationIndex[inserterEid] = animationIndex;
        Animation(world).isPlaying[inserterEid] = isPlaying;
        changedEntities.push(inserterEid);
      }
    }

    // Sync changed inserter entities
    if (changedEntities.length > 0) {
      const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.BUILDING_FULL_SERVER]);
      const serializedData = serialize(world, changedEntities);
      syncServerEntities(world, serializedData, SerializationID.BUILDING_FULL_SERVER);
    }

    return { worldData, sync, removeEntities };
  });
};
