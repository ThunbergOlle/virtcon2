import seedRandom from 'seedrandom';
import { InvalidStateError, TileType, TILE_LEVEL, TILE_TYPE, WithRequired } from '@shared';
import { createNoise2D } from 'simplex-noise';
import { all_spawnable_db_items } from '..';
import { DBItem } from './items/item_type';

export const getHeightAtPoint = (seed: number, x: number, y: number): number => {
  const randomGenerator = seedRandom(seed);
  const noise = createNoise2D(randomGenerator);
  return noise(x / 50, y / 50);
};

const getResourceForPosition = (
  x: number,
  y: number,
  seed: number,
): { resource: WithRequired<DBItem, 'spawnSettings'>; spawnChance: number } => {
  const clusterInfo = getNearestClusterInfo(x, y, seed);
  if (!clusterInfo) {
    // No cluster nearby, use isolated spawn chance
    const hash = hashPosition(x, y, seed);
    const resource = all_spawnable_db_items[Math.abs(hash % all_spawnable_db_items.length)] as WithRequired<DBItem, 'spawnSettings'>;
    if (!resource.spawnSettings) {
      throw new InvalidStateError(`Resource ${resource.name} does not have spawn settings defined.`);
    }

    const isolatedChance = resource.spawnSettings.chance * 0.3; // Reduce isolated spawns
    return { resource, spawnChance: isolatedChance };
  }

  const { resourceType, distance } = clusterInfo;
  const resource = resourceType;

  const clusterRadius = 8;
  const falloffFactor = Math.max(0, 1 - (distance / clusterRadius) * 2);

  const smoothFalloff = Math.pow(falloffFactor, 0.5);

  const baseChance = resource.spawnSettings.chance;
  const clusterChance = baseChance * (0.2 + smoothFalloff * 2.5);

  return { resource, spawnChance: Math.min(clusterChance, 0.8) }; // Cap at 80%
};

const getNearestClusterInfo = (
  x: number,
  y: number,
  seed: number,
): {
  center: { x: number; y: number };
  resourceType: WithRequired<DBItem, 'spawnSettings'>;
  distance: number;
} | null => {
  const searchRadius = 10;
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
          const resourceType = all_spawnable_db_items[Math.abs(centerHash % all_spawnable_db_items.length)] as WithRequired<
            DBItem,
            'spawnSettings'
          >;

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

export const shouldGenerateResource = (x: number, y: number, seed: number): { shouldSpawn: boolean; resource: DBItem } => {
  const { resource, spawnChance } = getResourceForPosition(x, y, seed);
  const hash = hashPosition(x, y, seed);
  const pseudoRandom = Math.abs(hash % 10000) / 10000;

  const height = getHeightAtPoint(seed, x, y);
  const canSpawn = resource.spawnSettings.minHeight <= height && resource.spawnSettings.maxHeight >= height;

  return { shouldSpawn: pseudoRandom < spawnChance && canSpawn, resource };
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

export const getTileAtPoint = (seed: number, x: number, y: number) => {
  const height = getHeightAtPoint(seed, x, y);
  const tileType = Object.entries(TILE_LEVEL).reduce((prev, [key, value]) => {
    if (height >= value) return key;

    return prev;
  }, TILE_TYPE.WATER as TileType);

  return tileType as TileType;
};
