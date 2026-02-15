import { defineSystem, World } from '@virtcon2/bytenetc';
import { all_db_buildings } from '@virtcon2/static-game-data';
import { buildingProcessingQueue } from '../worldBuilding/buildingProcessingQueue';
import { SyncEntities } from './types';

export const createBuildingProcessingSystem = (world: World) => {
  let tickCounter = 0;

  return defineSystem<SyncEntities>(({ worldData }) => {
    tickCounter++;

    // Find which building types need processing this tick
    const buildingsToProcess = all_db_buildings.filter((building) => tickCounter % building.processing_ticks === 0);

    // Enqueue processing commands (non-blocking)
    for (const buildingType of buildingsToProcess) {
      buildingProcessingQueue.enqueue({
        type: 'process_building',
        worldId: world,
        buildingType,
      });
    }

    return { worldData, sync: [], removeEntities: [] };
  });
};
