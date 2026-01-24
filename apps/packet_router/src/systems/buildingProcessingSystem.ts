import { defineSystem, World } from '@virtcon2/bytenetc';
import { all_db_buildings } from '@virtcon2/static-game-data';
import { buildingProcessingQueue } from '../worldBuilding/buildingProcessingQueue';
import { SyncEntities } from './types';

const INVENTORY_TRANSFER_INTERVAL = 20; // Every 20 ticks (1 second at 20 TPS)

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

    // Periodically process inventory transfers between connected buildings
    if (tickCounter % INVENTORY_TRANSFER_INTERVAL === 0) {
      buildingProcessingQueue.enqueue({
        type: 'transfer_inventories',
        worldId: world,
      });
    }

    return { worldData, sync: [], removeEntities: [] };
  });
};
