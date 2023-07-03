import { IWorld, Not, defineQuery, defineSystem, enterQuery, exitQuery } from '@virtcon2/virt-bit-ecs';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { Velocity } from '../components/Velocity';
import { getTextureFromTextureId } from '../config/SpriteMap';
import { GameState } from '../scenes/Game';
const spriteQuery = defineQuery([Sprite, Position]);
const spriteQueryEnter = enterQuery(spriteQuery);
const spriteQueryExit = exitQuery(spriteQuery);
export const createSpriteRegisterySystem = (scene: Phaser.Scene) => {
  return defineSystem((world: IWorld, state: GameState) => {
    const enterEntities = spriteQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const texId = Sprite.texture[id];
      const texture = getTextureFromTextureId(texId);
      if (!texture) {
        console.error('Texture not found for id: ' + texId);
        continue;
      }
      const sprite = scene.add.sprite(Position.x[id], Position.y[id], texture.textureName);
      if (texture.animations) {
        for (let i = 0; i < texture.animations.length; i++) {
          const animation = texture.animations[i];
          scene.anims.create({
            key: texture.textureName + '_anim_' + animation.name,
            frames: scene.anims.generateFrameNumbers(texture.textureName, { frames: animation.frames }),
            frameRate: animation.frameRate,
            repeat: animation.repeat,
          });
          if (animation.playOnCreate) {
            sprite.anims.play(texture.textureName + '_anim_' + animation.name);
          }
        }
      }

      sprite.setDataEnabled();
      state.spritesById[id] = sprite;
      if (Sprite.height[id] && Sprite.width[id]) {
        sprite.setDisplaySize(Sprite.width[id], Sprite.height[id]);
      }
      if (Sprite.opacity[id]) {
        sprite.setAlpha(Sprite.opacity[id]);
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
        sprite.setRotation(Sprite.rotation[id] || 0);
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
