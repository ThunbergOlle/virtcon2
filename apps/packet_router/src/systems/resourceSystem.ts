import { renderDistance } from '@shared';
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

const resourceQuery = defineQuery(Resource, Position);
const tileQuery = defineQuery(Tile, Position);
const tileQueryEnter = enterQuery(tileQuery);
const playerQuery = defineQuery(Player, Position);

const whichResource = (x: number, y: number, seed: number) => {
  const combinedSeed = `${x},${y},${seed}`;

  let hash = 0;
  for (let i = 0; i < combinedSeed.length; i++) {
    const char = combinedSeed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }

  return all_spawnable_db_items[Math.abs(hash % all_spawnable_db_items.length)];
};

const shouldGenerateResource = (x: number, y: number, seed: number, resourceChance = 0.1) => {
  const combinedSeed = `${x},${y},${seed}`;

  let hash = 0;
  for (let i = 0; i < combinedSeed.length; i++) {
    const char = combinedSeed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }

  const pseudoRandom = Math.abs(hash % 10000) / 10000;

  return pseudoRandom < resourceChance;
};

const buildingQuery = defineQuery(Building, Position);
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

      const item = whichResource(x, y, seed);
      const resourceAtLocation = shouldGenerateResource(x, y, seed, item.spawnSettings.chance);

      if (!resourceAtLocation) continue;
      const height = DBWorld.getHeightAtPoint(seed, x, y);
      const canSpawn = item.spawnSettings.minHeight <= height && item.spawnSettings.maxHeight >= height;
      if (!canSpawn) continue;

      if (buildingEntities.some(buildingAtPosition(x, y))) continue;

      const resourceEntityId = createNewResourceEntity(world, {
        resourceName: getResourceNameFromItemName(item.name),
        pos: { x, y },
        itemId: item.id,
        worldBuildingId: 0,
      });

      newEntities.push(resourceEntityId);
      break;
    }

    for (let i = 0; i < playerEntities.length; i++) {
      const playerEid = playerEntities[i];
      const { x, y } = fromPhaserPos({ x: Position.x[playerEid], y: Position.y[playerEid] });

      const [minX, maxX] = [x - renderDistance, x + renderDistance];
      const [minY, maxY] = [y - renderDistance, y + renderDistance];

      for (let j = 0; j < resourceEntities.length; j++) {
        const resourceEid = resourceEntities[j];
        const { x: resourceX, y: resourceY } = fromPhaserPos({ x: Position.x[resourceEid], y: Position.y[resourceEid] });

        if (resourceX >= minX && resourceX <= maxX && resourceY >= minY && resourceY <= maxY) {
          continue;
        }

        if (resourceX < minX || resourceX > maxX || resourceY < minY || resourceY > maxY) {
          removeEntity(world, resourceEid);
          removedEntities.push(resourceEid);
        }
      }
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
