import { defineQuery, defineSystem, Not, World, removeComponent } from '@virtcon2/bytenetc';
import {
  Resource,
  Position,
  Sprite,
  MainPlayer,
  addSpriteToResourceEntity,
  fromPhaserPos,
} from '@virtcon2/network-world-entities';
import { renderDistance } from '@shared';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { GameState } from '../scenes/Game';

export const createResourceSpriteManagementSystem = (world: World) => {
  const resourceWithoutSpriteQuery = defineQuery(Resource, Position, Not(Sprite));
  const resourceWithSpriteQuery = defineQuery(Resource, Position, Sprite);
  const mainPlayerQuery = defineQuery(MainPlayer, Position);

  return defineSystem<GameState>((state) => {
    const resourcesWithoutSprite = resourceWithoutSpriteQuery(world);
    const resourcesWithSprite = resourceWithSpriteQuery(world);
    const mainPlayerEntities = mainPlayerQuery(world);

    if (mainPlayerEntities.length === 0) return state;

    const mainPlayerEid = mainPlayerEntities[0];
    const playerPos = fromPhaserPos({
      x: Position(world).x[mainPlayerEid],
      y: Position(world).y[mainPlayerEid],
    });

    // Add sprites to resources within render distance
    for (let i = 0; i < resourcesWithoutSprite.length; i++) {
      const resourceEid = resourcesWithoutSprite[i];
      const resourcePos = fromPhaserPos({
        x: Position(world).x[resourceEid],
        y: Position(world).y[resourceEid],
      });

      const dx = Math.abs(resourcePos.x - playerPos.x);
      const dy = Math.abs(resourcePos.y - playerPos.y);

      if (dx <= renderDistance && dy <= renderDistance) {
        const item = get_item_by_id(Resource(world).itemId[resourceEid]);
        if (item?.resource) {
          addSpriteToResourceEntity(
            world,
            { pos: resourcePos, resourceName: item.resource.name },
            resourceEid
          );
        }
      }
    }

    // Remove sprites from resources outside render distance
    for (let i = 0; i < resourcesWithSprite.length; i++) {
      const resourceEid = resourcesWithSprite[i];
      const resourcePos = fromPhaserPos({
        x: Position(world).x[resourceEid],
        y: Position(world).y[resourceEid],
      });

      const dx = Math.abs(resourcePos.x - playerPos.x);
      const dy = Math.abs(resourcePos.y - playerPos.y);

      if (dx > renderDistance || dy > renderDistance) {
        removeComponent(world, Sprite, resourceEid);
      }
    }

    return state;
  });
};
