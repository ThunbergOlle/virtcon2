import { defineQuery, defineSerializer, World } from '@virtcon2/bytenetc';
import { Animation, Building, getSerializeConfig, Inserter, Position, SerializationID } from '@virtcon2/network-world-entities';
import { syncServerEntities } from '../packet/enqueue';
import { defineSystem } from '@virtcon2/bytenetc';
import { SyncEntities } from './types';

const INSERTER_ANIMATION_TICKS = 16; // Full animation cycle: 8 frames at 10fps = 0.8s = 16 ticks at 20 TPS

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
      const heldItemId = Inserter(world).heldItemId[inserterEid];
      let holdingTick = Inserter(world).holdingTick[inserterEid];

      // Just picked up: start animation
      if (heldItemId !== 0 && holdingTick === 0) {
        Animation(world).animationIndex[inserterEid] = direction + 4;
        Animation(world).isPlaying[inserterEid] = 1;
        Inserter(world).holdingTick[inserterEid] = 1;
        changedEntities.push(inserterEid);
        continue;
      }

      // Idle — nothing to do
      if (holdingTick === 0) continue;

      // Increment tick
      holdingTick++;
      Inserter(world).holdingTick[inserterEid] = holdingTick;

      // At midpoint: if inserter disabled (output blocked), pause animation
      if (holdingTick >= 8 && Inserter(world).enabled[inserterEid] === 0 && Animation(world).isPlaying[inserterEid] !== 0) {
        Animation(world).isPlaying[inserterEid] = 0;
        changedEntities.push(inserterEid);
      }

      // After full cycle
      if (holdingTick >= INSERTER_ANIMATION_TICKS) {
        if (heldItemId === 0) {
          // Item was dropped — reset to idle
          Inserter(world).enabled[inserterEid] = 1;
          Animation(world).animationIndex[inserterEid] = direction;
          Animation(world).isPlaying[inserterEid] = 1;
          Inserter(world).holdingTick[inserterEid] = 0;
          if (!changedEntities.includes(inserterEid)) changedEntities.push(inserterEid);
          continue; // Skip cap check — holdingTick is already reset to 0
        } else if (Animation(world).isPlaying[inserterEid] !== 0) {
          // Output blocked, item still held — pause animation
          Inserter(world).enabled[inserterEid] = 0;
          Animation(world).animationIndex[inserterEid] = direction;
          Animation(world).isPlaying[inserterEid] = 0;
          if (!changedEntities.includes(inserterEid)) changedEntities.push(inserterEid);
        }

        // Cap holdingTick to prevent overflow
        if (holdingTick > INSERTER_ANIMATION_TICKS) {
          Inserter(world).holdingTick[inserterEid] = INSERTER_ANIMATION_TICKS;
        }
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
