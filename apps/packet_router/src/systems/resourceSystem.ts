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
  serializeConfig,
} from '@virtcon2/network-world-entities';
import { all_spawnable_db_items, getResourceNameFromItemName, DBItem } from '@virtcon2/static-game-data';
import { World as DBWorld } from '@virtcon2/database-postgres';
import { shouldServerKeep } from './tileSystem';
import { SyncEntities } from './types';

const getResourceForPosition = (hash: number): { resource: DBItem; spawnChance: number } => {
  const resource = all_spawnable_db_items[Math.abs(hash % all_spawnable_db_items.length)];
  const isolatedChance = resource.spawnSettings.chance * 0.5;
  return { resource, spawnChance: isolatedChance };
};

const shouldGenerateResource = (hash: number): { shouldSpawn: boolean; resource: DBItem } => {
  const { resource, spawnChance } = getResourceForPosition(hash);
  const pseudoRandom = Math.abs(hash % 10000) / 10000;

  return { shouldSpawn: pseudoRandom > spawnChance, resource };
};

export const createResourceSystem = (world: World, seed: number) => {
  const resourceQuery = defineQuery(Resource, Position);
  const tileQuery = defineQuery(GrowableTile, Position);
  const tileQueryEnter = enterQuery(tileQuery);
  const playerQuery = defineQuery(Player, Position);
  const buildingQuery = defineQuery(Building, Position);

  return defineSystem<SyncEntities>((_) => {
    const resourceEntities = resourceQuery(world);
    const tileEnterEntities = tileQueryEnter(world);
    const playerEntities = playerQuery(world);
    const buildingEntities = buildingQuery(world);

    const removedEntities = [];
    const newEntities = [];

    for (let i = 0; i < tileEnterEntities.length; i++) {
      const tileEid = tileEnterEntities[i];
      const { x, y } = fromPhaserPos({ x: Position.x[tileEid], y: Position.y[tileEid] });

      const { shouldSpawn, resource } = shouldGenerateResource(GrowableTile.hash[tileEid]);
      console.log(
        `Entering tile at (${x}, ${y}) with hash: ${GrowableTile.hash[tileEid]}, shouldSpawn: ${shouldSpawn}, resource: ${resource.name}`,
      );

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
    }

    for (let i = 0; i < resourceEntities.length; i++) {
      const resourceEid = resourceEntities[i];

      if (shouldServerKeep(playerEntities, resourceEid)) continue;

      removedEntities.push(resourceEid);
      removeEntity(world, resourceEid);
    }

    const serializedResources = defineSerializer(serializeConfig[SerializationID.RESOURCE])(world, newEntities);
    return {
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

const buildingAtPosition = (x: number, y: number) => (building: number) => {
  const { x: buildingX, y: buildingY } = fromPhaserPos({ x: Position.x[building], y: Position.y[building] });

  return buildingX === x && buildingY === y;
};
