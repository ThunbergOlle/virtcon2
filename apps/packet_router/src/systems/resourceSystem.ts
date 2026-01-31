import { renderDistance } from '@shared';
import { defineQuery, defineSerializer, defineSystem, Has, Not, removeComponent, World } from '@virtcon2/bytenetc';
import {
  fromPhaserPos,
  Player,
  Position,
  Resource,
  SerializationID,
  getSerializeConfig,
  Sprite,
  addSpriteToResourceEntity,
} from '@virtcon2/network-world-entities';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { shouldServerKeep } from './tileSystem';
import { SyncEntities } from './types';

// 1.  Load all resources from the database
// 2.  resource system is just for adding and removing the sprite component based on player proximity and tile

export const createResourceSystem = (world: World, seed: number) => {
  const resourceWithoutSpriteQuery = defineQuery(Resource, Position, Not(Sprite));
  const fullResourceQuery = defineQuery(Resource, Position, Sprite);
  const playerQuery = defineQuery(Player, Position);

  return defineSystem<SyncEntities>(({ worldData }) => {
    const resourceEntitiesWithoutSprite = resourceWithoutSpriteQuery(world);
    const fullResources = fullResourceQuery(world);
    const playerEntities = playerQuery(world);

    const newEntities = [];

    for (let i = 0; i < playerEntities.length; i++) {
      const playerEid = playerEntities[i];
      const { x, y } = fromPhaserPos({ x: Position(world).x[playerEid], y: Position(world).y[playerEid] });

      const [minX, maxX] = [x - renderDistance, x + renderDistance];
      const [minY, maxY] = [y - renderDistance, y + renderDistance];
      for (let tx = minX; tx <= maxX; tx++) {
        for (let ty = minY; ty <= maxY; ty++) {
          const resourceEntity = resourceEntitiesWithoutSprite.find((resourceEid) => {
            const { x: resourceX, y: resourceY } = fromPhaserPos({
              x: Position(world).x[resourceEid],
              y: Position(world).y[resourceEid],
            });
            return resourceX === tx && resourceY === ty;
          });
          if (!resourceEntity) continue;

          const item = get_item_by_id(Resource(world).itemId[resourceEntity]);

          console.log(`Adding sprite to resource entity at (${tx}, ${ty}) for player at (${x}, ${y})`);
          addSpriteToResourceEntity(world, { pos: { x: tx, y: ty }, resourceName: item.resource?.name }, resourceEntity);
        }
      }
    }

    for (let i = 0; i < fullResources.length; i++) {
      const resourceEid = fullResources[i];

      if (shouldServerKeep(world, playerEntities, resourceEid)) continue;

      console.log(`Removing sprite from resource entity id ${resourceEid} due to no players nearby`);
      removeComponent(world, Sprite, resourceEid);
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
      removeEntities: [],
    };
  });
};

// Improved cluster detection using Voronoi-like approach

const buildingAtPosition = (world: World, x: number, y: number) => (building: number) => {
  const { x: buildingX, y: buildingY } = fromPhaserPos({ x: Position(world).x[building], y: Position(world).y[building] });

  return buildingX === x && buildingY === y;
};
