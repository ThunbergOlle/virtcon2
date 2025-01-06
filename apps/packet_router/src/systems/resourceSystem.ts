import { renderDistance } from '@shared';
import { defineQuery, defineSerializer, defineSystem, enterQuery, removeEntity, World } from '@virtcon2/bytenetc';
import {
  createNewResourceEntity,
  fromPhaserPos,
  Player,
  Position,
  Resource,
  SerializationID,
  serializeConfig,
  Tile,
} from '@virtcon2/network-world-entities';
import seedRandom from 'seedrandom';
import { all_spawnable_db_items, getResourceNameFromItemName } from '@virtcon2/static-game-data';
import { syncRemoveEntities, syncServerEntities } from '@virtcon2/network-packet';
import { redisClient } from '../redis';

const resourceQuery = defineQuery(Resource, Position);
const tileQuery = defineQuery(Tile, Position);
const tileQueryEnter = enterQuery(tileQuery);
const playerQuery = defineQuery(Player, Position);

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

export const createResourceSystem = (world: World, seed: number) => {
  const seededRandom: () => number = seedRandom(seed);
  const shuffled_spawnable_resources = all_spawnable_db_items.sort(() => 0.5 - seededRandom());

  return defineSystem(() => {
    const resourceEntities = resourceQuery(world);
    const tileEnterEntities = tileQueryEnter(world);
    const playerEntities = playerQuery(world);

    if (!playerEntities.length) return;

    const removedEntities = [];
    const newEntities = [];

    for (let i = 0; i < tileEnterEntities.length; i++) {
      const tileEid = tileEnterEntities[i];
      const { x, y } = fromPhaserPos({ x: Position.x[tileEid], y: Position.y[tileEid] });

      spawnLoop: for (const item of shuffled_spawnable_resources) {
        const resourceAtLocation = shouldGenerateResource(x, y, seed, item.spawnSettings.chance);

        if (!resourceAtLocation) continue spawnLoop;

        const resourceEntityId = createNewResourceEntity(world, {
          resourceName: getResourceNameFromItemName(item.name),
          pos: { x, y },
          itemId: item.id,
          worldBuildingId: 0,
        });

        newEntities.push(resourceEntityId);
        break spawnLoop;
      }
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
