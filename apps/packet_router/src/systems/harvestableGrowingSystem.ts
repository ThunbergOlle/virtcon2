import { defineQuery, defineSerializer, defineSystem, World } from '@virtcon2/bytenetc';
import {
  Harvestable,
  Sprite,
  getSerializeConfig,
  SerializationID,
  AllTextureMaps,
  getSpriteForAge,
} from '@virtcon2/network-world-entities';
import { Harvestable as HarvestableData, get_item_by_id } from '@virtcon2/static-game-data';
import { SyncEntities } from './types';

const GROWTH_INTERVAL_TICKS = 300; // 15 seconds at 20 TPS
const GROWTH_INCREMENT = 300; // Match interval so age tracks real time

/**
 * Get the maximum age for a harvestable based on its states
 */
const getMaxAge = (harvestableInfo: (typeof HarvestableData)[keyof typeof HarvestableData]): number => {
  return Math.max(...harvestableInfo.states.map((s) => s.age));
};

/**
 * Get the growth state index by finding the highest threshold <= current age
 */
const getGrowthStateIndex = (harvestableInfo: (typeof HarvestableData)[keyof typeof HarvestableData], age: number): number => {
  const sortedStates = [...harvestableInfo.states].sort((a, b) => b.age - a.age);
  for (let i = 0; i < sortedStates.length; i++) {
    if (age >= sortedStates[i].age) {
      return sortedStates.length - 1 - i; // Return index in original order
    }
  }
  return 0;
};

export const createHarvestableGrowingSystem = (world: World) => {
  let tickCounter = 0;
  const harvestableQuery = defineQuery(Harvestable);

  return defineSystem<SyncEntities>(({ worldData, sync, removeEntities }) => {
    tickCounter++;

    // Only process every GROWTH_INTERVAL_TICKS
    if (tickCounter % GROWTH_INTERVAL_TICKS !== 0) {
      return { worldData, sync, removeEntities };
    }

    const harvestableEntities = harvestableQuery(world);
    const changedEntities: number[] = [];

    for (let i = 0; i < harvestableEntities.length; i++) {
      const eid = harvestableEntities[i];
      const itemId = Harvestable(world).itemId[eid];
      const item = get_item_by_id(itemId);

      if (!item?.harvestable) continue;

      const harvestableInfo = HarvestableData[item.harvestable.name];
      if (!harvestableInfo) continue;

      const currentAge = Harvestable(world).age[eid];
      const maxAge = getMaxAge(harvestableInfo);

      // Skip if already at max age
      if (currentAge >= maxAge) continue;

      // Get growth state before increment
      const prevStateIndex = getGrowthStateIndex(harvestableInfo, currentAge);

      // Increment age (capped at max)
      const newAge = Math.min(currentAge + GROWTH_INCREMENT, maxAge);
      Harvestable(world).age[eid] = newAge;

      // Get growth state after increment
      const newStateIndex = getGrowthStateIndex(harvestableInfo, newAge);

      // If growth stage changed, update sprite texture and mark for sync
      if (newStateIndex !== prevStateIndex) {
        const newSpriteName = getSpriteForAge(harvestableInfo, newAge);
        const textureMetadata = AllTextureMaps[newSpriteName as keyof typeof AllTextureMaps];

        if (textureMetadata) {
          Sprite(world).texture[eid] = textureMetadata.textureId;
        }

        changedEntities.push(eid);
      }
    }

    // Only sync harvestables that changed growth stage
    if (changedEntities.length > 0) {
      const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.HARVESTABLE]);
      const serializedData = serialize(world, changedEntities);

      sync.push({
        data: serializedData,
        serializationId: SerializationID.HARVESTABLE,
      });
    }

    return { worldData, sync, removeEntities };
  });
};
