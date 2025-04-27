import { defineQuery, defineSerializer, defineSystem, enterQuery, removeEntity, World } from '@virtcon2/bytenetc';
import {
  Building,
  createNewResourceEntity,
  fromPhaserPos,
  Player,
  Position,
  Resource,
  SerializationID,
  serializeConfig,
  Tile,
} from '@virtcon2/network-world-entities';
import { all_spawnable_db_items, getResourceNameFromItemName } from '@virtcon2/static-game-data';
import { syncRemoveEntities, syncServerEntities } from '@virtcon2/network-packet';
import { World as DBWorld } from '@virtcon2/database-postgres';
import { redisClient } from '../redis';
import { shouldServerKeep } from './tileSystem';

const resourceQuery = defineQuery(Resource, Position);
const tileQuery = defineQuery(Tile, Position);
const tileQueryEnter = enterQuery(tileQuery);
const playerQuery = defineQuery(Player, Position);
const buildingQuery = defineQuery(Building, Position);

// Hash function for position-based randomization
const hashPosition = (x: number, y: number, seed: number): number => {
  const combinedSeed = `${x},${y},${seed}`;

  let hash = 0;
  for (let i = 0; i < combinedSeed.length; i++) {
    const char = combinedSeed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }

  return hash;
};

// Determine if a position is a cluster center
const isClusterCenter = (x: number, y: number, seed: number): boolean => {
  const hash = hashPosition(x, y, seed);
  return Math.abs(hash % 100) < 5; // 5% chance of being a cluster center
};

// Get cluster center for a given position
const getClusterCenter = (x: number, y: number, seed: number): { x: number; y: number } | null => {
  // Check if this position itself is a cluster center
  if (isClusterCenter(x, y, seed)) {
    return { x, y };
  }

  // Check surrounding area for a cluster center
  const searchRadius = 7;
  for (let dx = -searchRadius; dx <= searchRadius; dx++) {
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      if (dx === 0 && dy === 0) continue;

      const nx = x + dx;
      const ny = y + dy;

      if (isClusterCenter(nx, ny, seed)) {
        return { x: nx, y: ny };
      }
    }
  }

  return null;
};

// Get resource for a position considering its cluster membership
const getResourceForPosition = (x: number, y: number, seed: number): { resource: any; spawnChance: number } => {
  const clusterCenter = getClusterCenter(x, y, seed);

  if (!clusterCenter) {
    // Not part of a cluster, use original random resource generation with reduced chance
    const hash = hashPosition(x, y, seed);
    const resource = all_spawnable_db_items[Math.abs(hash % all_spawnable_db_items.length)];
    // Lower chance for isolated resources
    const isolatedChance = resource.spawnSettings.chance * 0.5;
    return { resource, spawnChance: isolatedChance };
  }

  // Part of a cluster - get deterministic resource type for this cluster
  const centerHash = hashPosition(clusterCenter.x, clusterCenter.y, seed);
  const resource = all_spawnable_db_items[Math.abs(centerHash % all_spawnable_db_items.length)];

  // Calculate chance based on distance from center
  const distToCenter = Math.sqrt(Math.pow(x - clusterCenter.x, 2) + Math.pow(y - clusterCenter.y, 2));

  // Higher chance near center, lower chance farther away
  const baseChance = resource.spawnSettings.chance;
  const distanceFactor = Math.max(0, 1 - distToCenter / 7); // Fade out over 3 tiles
  const clusterChance = baseChance * (0.5 + distanceFactor * 100);

  return { resource, spawnChance: clusterChance };
};

const shouldGenerateResource = (x: number, y: number, seed: number): { shouldSpawn: boolean; resource: any } => {
  const { resource, spawnChance } = getResourceForPosition(x, y, seed);
  const hash = hashPosition(x, y, seed * 31 + 17);
  const pseudoRandom = Math.abs(hash % 10000) / 10000;

  return { shouldSpawn: pseudoRandom > spawnChance, resource };
};

export const createResourceSystem = (world: World, seed: number) => {
  return defineSystem(() => {
    const resourceEntities = resourceQuery(world);
    const tileEnterEntities = tileQueryEnter(world);
    const playerEntities = playerQuery(world);
    const buildingEntities = buildingQuery(world);

    const removedEntities = [];
    const newEntities = [];

    for (let i = 0; i < tileEnterEntities.length; i++) {
      const tileEid = tileEnterEntities[i];
      const { x, y } = fromPhaserPos({ x: Position.x[tileEid], y: Position.y[tileEid] });

      const { shouldSpawn, resource } = shouldGenerateResource(x, y, seed);

      if (!shouldSpawn) continue;

      const height = DBWorld.getHeightAtPoint(seed, x, y);
      const canSpawn = resource.spawnSettings.minHeight <= height && resource.spawnSettings.maxHeight >= height;
      if (!canSpawn) continue;

      if (buildingEntities.some(buildingAtPosition(x, y))) continue;

      const resourceEntityId = createNewResourceEntity(world, {
        resourceName: getResourceNameFromItemName(resource.name),
        pos: { x, y },
        itemId: resource.id,
        worldBuildingId: 0,
      });

      newEntities.push(resourceEntityId);
      break;
    }

    for (let i = 0; i < resourceEntities.length; i++) {
      const resourceEid = resourceEntities[i];

      if (shouldServerKeep(playerEntities, resourceEid)) continue;

      removedEntities.push(resourceEid);
      removeEntity(world, resourceEid);
    }

    syncRemoveEntities(redisClient, world, world, removedEntities).then(() => {
      const serializedResources = defineSerializer(serializeConfig[SerializationID.RESOURCE])(world, newEntities);
      syncServerEntities(redisClient, world, world, serializedResources, SerializationID.RESOURCE);
    });
  });
};

const buildingAtPosition = (x: number, y: number) => (building: number) => {
  const { x: buildingX, y: buildingY } = fromPhaserPos({ x: Position.x[building], y: Position.y[building] });

  return buildingX === x && buildingY === y;
};
