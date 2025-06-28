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
import { getResourceNameFromItemName, shouldGenerateResource } from '@virtcon2/static-game-data';
import { shouldServerKeep } from './tileSystem';
import { SyncEntities } from './types';

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

const buildingAtPosition = (world: World, x: number, y: number) => (building: number) => {
  const { x: buildingX, y: buildingY } = fromPhaserPos({ x: Position(world).x[building], y: Position(world).y[building] });

  return buildingX === x && buildingY === y;
};
