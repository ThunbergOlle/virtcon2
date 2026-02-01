import { defineQuery, defineSystem, Not, World, addComponent, removeComponent } from '@virtcon2/bytenetc';
import {
  Harvestable,
  Position,
  Sprite,
  MainPlayer,
  fromPhaserPos,
  AllTextureMaps,
  getSpriteForAge,
} from '@virtcon2/network-world-entities';
import { renderDistance } from '@shared';
import { get_item_by_id, Harvestable as HarvestableData } from '@virtcon2/static-game-data';
import { GameState } from '../scenes/Game';

export const createHarvestableSpriteManagementSystem = (world: World) => {
  const harvestableWithoutSpriteQuery = defineQuery(Harvestable, Position, Not(Sprite));
  const harvestableWithSpriteQuery = defineQuery(Harvestable, Position, Sprite);
  const mainPlayerQuery = defineQuery(MainPlayer, Position);

  return defineSystem<GameState>((state) => {
    const harvestablesWithoutSprite = harvestableWithoutSpriteQuery(world);
    const harvestablesWithSprite = harvestableWithSpriteQuery(world);
    const mainPlayerEntities = mainPlayerQuery(world);

    if (mainPlayerEntities.length === 0) return state;

    const mainPlayerEid = mainPlayerEntities[0];
    const playerPos = fromPhaserPos({
      x: Position(world).x[mainPlayerEid],
      y: Position(world).y[mainPlayerEid],
    });

    // Add sprites to harvestables within render distance
    for (let i = 0; i < harvestablesWithoutSprite.length; i++) {
      const harvestableEid = harvestablesWithoutSprite[i];
      const harvestablePos = fromPhaserPos({
        x: Position(world).x[harvestableEid],
        y: Position(world).y[harvestableEid],
      });

      const dx = Math.abs(harvestablePos.x - playerPos.x);
      const dy = Math.abs(harvestablePos.y - playerPos.y);

      if (dx <= renderDistance && dy <= renderDistance) {
        const item = get_item_by_id(Harvestable(world).itemId[harvestableEid]);
        if (item?.harvestable) {
          const harvestableInfo = HarvestableData[item.harvestable.name];
          const age = Harvestable(world).age[harvestableEid];
          const spriteName = getSpriteForAge(harvestableInfo, age);
          const textureMetadata = AllTextureMaps[spriteName] ?? AllTextureMaps[item.harvestable.name];

          Sprite(world).texture[harvestableEid] = textureMetadata?.textureId ?? 0;
          Sprite(world).variant[harvestableEid] = (harvestablePos.x + harvestablePos.y) % (textureMetadata?.variants.length ?? 0);
          Sprite(world).opacity[harvestableEid] = 1;
          Sprite(world).width[harvestableEid] = (harvestableInfo.spriteWidth ?? harvestableInfo.width ?? 1) * 16;
          Sprite(world).height[harvestableEid] = (harvestableInfo.spriteHeight ?? harvestableInfo.height ?? 1) * 16;
        }
      }
    }

    // Remove sprites from harvestables outside render distance
    for (let i = 0; i < harvestablesWithSprite.length; i++) {
      const harvestableEid = harvestablesWithSprite[i];
      const harvestablePos = fromPhaserPos({
        x: Position(world).x[harvestableEid],
        y: Position(world).y[harvestableEid],
      });

      const dx = Math.abs(harvestablePos.x - playerPos.x);
      const dy = Math.abs(harvestablePos.y - playerPos.y);

      if (dx > renderDistance || dy > renderDistance) {
        removeComponent(world, Sprite, harvestableEid);
      }
    }

    return state;
  });
};
