import { defineQuery, defineSerializer, defineSystem, enterQuery, removeEntity, World } from '@virtcon2/bytenetc';
import {
  Building,
  createNewResourceEntity,
  GrowableTile,
  fromPhaserPos,
  Player,
  Position,
  Resource,
  SerializationID,
  getSerializeConfig,
} from '@virtcon2/network-world-entities';
import { all_spawnable_db_items, getResourceNameFromItemName, DBItem } from '@virtcon2/static-game-data';
import { World as DBWorld } from '@virtcon2/database-postgres';
import { shouldServerKeep } from './tileSystem';
import { SyncEntities } from './types';

const getResourceForPosition = (x: number, y: number, seed: number): { resource: DBItem; spawnChance: number } => {
  const clusterInfo = getNearestClusterInfo(x, y, seed);

  if (!clusterInfo) {
    // No cluster nearby, use isolated spawn chance
    const hash = hashPosition(x, y, seed);
    const resource = all_spawnable_db_items[Math.abs(hash % all_spawnable_db_items.length)];
    const isolatedChance = resource.spawnSettings.chance * 0.3; // Reduce isolated spawns
    return { resource, spawnChance: isolatedChance };
  }

  const { resourceType, distance } = clusterInfo;
  const resource = resourceType;

  const clusterRadius = 8;
  const falloffFactor = Math.max(0, 1 - distance / clusterRadius);

  const smoothFalloff = Math.pow(falloffFactor, 0.5);

  const baseChance = resource.spawnSettings.chance;
  const clusterChance = baseChance * (0.2 + smoothFalloff * 2.5);

  return { resource, spawnChance: Math.min(clusterChance, 0.8) }; // Cap at 80%
};

const shouldGenerateResource = (x: number, y: number, seed: number): { shouldSpawn: boolean; resource: DBItem } => {
  const { resource, spawnChance } = getResourceForPosition(x, y, seed);
  const hash = hashPosition(x, y, seed);
  const pseudoRandom = Math.abs(hash % 10000) / 10000;

  return { shouldSpawn: pseudoRandom < spawnChance, resource };
};

export const createResourceSystem = (world: World, seed: number) => {
  const resourceQuery = defineQuery(Resource, Position);
  const tileQuery = defineQuery(GrowableTile, Position);
  const tileQueryEnter = enterQuery(tileQuery);
  const playerQuery = defineQuery(Player, Position);
  const buildingQuery = defineQuery(Building, Position);

  return defineSystem<SyncEntities>(({ worldData }) => {
    const resourceEntities = resourceQuery(world);
    const tileEnterEntities = tileQueryEnter(world);
    const playerEntities = playerQuery(world);
    const buildingEntities = buildingQuery(world);

    const removedEntities = [];
    const newEntities = [];

    for (let i = 0; i < tileEnterEntities.length; i++) {
      const tileEid = tileEnterEntities[i];
      const { x, y } = fromPhaserPos({ x: Position(world).x[tileEid], y: Position(world).y[tileEid] });

      const { shouldSpawn, resource } = shouldGenerateResource(x, y, seed);
      if (!shouldSpawn) continue;

      const height = DBWorld.getHeightAtPoint(seed, x, y);
      const canSpawn = resource.spawnSettings.minHeight <= height && resource.spawnSettings.maxHeight >= height;
      if (!canSpawn) continue;

      if (buildingEntities.some(buildingAtPosition(world, x, y))) continue;

      const resourceEntityId = createNewResourceEntity(world, {
        resourceName: getResourceNameFromItemName(resource.name),
        pos: { x, y },
        itemId: resource.id,
        worldBuildingId: 0,
      });

      newEntities.push(resourceEntityId);
    }

    for (let i = 0; i < resourceEntities.length; i++) {
      const resourceEid = resourceEntities[i];

      if (shouldServerKeep(world, playerEntities, resourceEid)) continue;

      removedEntities.push(resourceEid);
      removeEntity(world, resourceEid);
    }

    const serializedResources = defineSerializer(getSerializeConfig(world)[SerializationID.RESOURCE])(world, newEntities);
    return {
      worldData,
      sync: [
        {
          data: serializedResources,
          serializationId: SerializationID.RESOURCE,
        },
      ],
      removeEntities: removedEntities,
    };
  });
};

// Improved cluster detection using Voronoi-like approach
const getNearestClusterInfo = (
  x: number,
  y: number,
  seed: number,
): {
  center: { x: number; y: number };
  resourceType: DBItem;
  distance: number;
} | null => {
  const searchRadius = 12;
  let nearestCluster = null;
  let minDistance = Infinity;

  for (let dx = -searchRadius; dx <= searchRadius; dx++) {
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      const cx = x + dx;
      const cy = y + dy;

      if (isClusterCenter(cx, cy, seed)) {
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          const centerHash = hashPosition(cx, cy, seed);
          const resourceType = all_spawnable_db_items[Math.abs(centerHash % all_spawnable_db_items.length)];

          nearestCluster = {
            center: { x: cx, y: cy },
            resourceType,
            distance,
          };
        }
      }
    }
  }

  return nearestCluster;
};

const isClusterCenter = (x: number, y: number, seed: number): boolean => {
  const hash = hashPosition(x, y, seed);
  return Math.abs(hash % 100) < 5;
};

const hashPosition = (x: number, y: number, seed: number): number => {
  let hash = seed;

  hash ^= x + 0x9e3779b9 + (hash << 6) + (hash >> 2);
  hash ^= y + 0x9e3779b9 + (hash << 6) + (hash >> 2);

  hash = hash ^ (hash >>> 16);
  hash = hash * 0x85ebca6b;
  hash = hash ^ (hash >>> 13);
  hash = hash * 0xc2b2ae35;
  hash = hash ^ (hash >>> 16);

  return hash;
};

const buildingAtPosition = (world: World, x: number, y: number) => (building: number) => {
  const { x: buildingX, y: buildingY } = fromPhaserPos({ x: Position(world).x[building], y: Position(world).y[building] });

  return buildingX === x && buildingY === y;
};
