import { IWorld, Not, defineQuery, defineSystem, enterQuery, exitQuery } from '@virtcon2/virt-bit-ecs';
import { Sprite } from '../components/Sprite';
import { Position } from '../components/Position';
import { GameState } from '../scenes/Game';
import { Velocity } from '../components/Velocity';
const spriteQuery = defineQuery([Sprite, Position]);
const spriteQueryEnter = enterQuery(spriteQuery);
const spriteQueryExit = exitQuery(spriteQuery);
export const createSpriteRegisterySystem = (scene: Phaser.Scene, textures: string[]) => {
  return defineSystem((world: IWorld, state: GameState) => {
    const enterEntities = spriteQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const texId = Sprite.texture[id];
      const texture = textures[texId];
      const sprite = scene.add.sprite(Position.x[id], Position.y[id], texture);
      state.spritesById[id] = sprite;
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
const spritePosQuery = defineQuery([Sprite, Position, Not(Velocity)]);
const spriteVelocityQuery = defineQuery([Sprite, Position, Velocity]);

export const createSpriteSystem = () => {
  return defineSystem((world: IWorld, state: GameState) => {
    const posEntities = spritePosQuery(world);
    for (let i = 0; i < posEntities.length; i++) {
      const id = posEntities[i];
      const sprite = state.spritesById[id];
      if (sprite) {
        sprite.setPosition(Position.x[id], Position.y[id]);
      }
    }
    const velocityEntities = spriteVelocityQuery(world);
    for (let i = 0; i < velocityEntities.length; i++) {
      const id = velocityEntities[i];
      const sprite = state.spritesById[id] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (sprite && sprite.body) {
        sprite.body.setVelocity(Velocity.x[id], Velocity.y[id]);
      }
    }
    return { world, state };
  });
};
