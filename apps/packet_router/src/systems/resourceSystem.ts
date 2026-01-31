import { defineSystem, World } from '@virtcon2/bytenetc';
import { SyncEntities } from './types';

// 1.  Load all resources from the database
// 2.  resource system is just for adding and removing the sprite component based on player proximity and tile

export const createResourceSystem = (_world: World, _seed: number) => {
  return defineSystem<SyncEntities>(({ worldData }) => {
    // Server no longer manages sprite components for resources
    // Sprite management is handled entirely client-side for rendering optimization
    return {
      worldData,
      sync: [],
      removeEntities: [],
    };
  });
};
