import { IWorld, defineQuery, defineSystem, enterQuery, exitQuery } from '@virtcon2/virt-bit-ecs';
import { Sprite } from '../components/Sprite';
import { Position } from '../components/Position';
import { GameState } from '../scenes/Game';
const spriteQuery = defineQuery([Sprite, Position]);
const spriteQueryEnter = enterQuery(spriteQuery);
const spriteQueryExit = exitQuery(spriteQuery);
export const createSpriteSystem = (scene: Phaser.Scene, textures: string[]) => {
  return defineSystem((world: IWorld, state: GameState) => {
    const enterEntities = spriteQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const texId = Sprite.texture[id];
      const texture = textures[texId];
      console.log(`Entity ${id} has texture ${texture} as pos ${Position.x[id]}, ${Position.y[id]}`);
      const sprite = scene.add.sprite(Position.x[id], Position.y[id], texture);
      state.spritesById[id] = sprite;
    }

    const entities = spriteQuery(world);
    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      const sprite = state.spritesById[id];
      if (sprite) {
        sprite.setPosition(Position.x[id], Position.y[id]);
      }
    }
    const exitEntities = spriteQueryExit(world);
    for (let i = 0; i < exitEntities.length; i++) {
      const id = exitEntities[i];
      const sprite = state.spritesById[id];
      if (sprite) {
        sprite.destroy();
        delete state.spritesById[id];
      }
    }
    return { world, state };
  });
};
