import { Position, Sprite, Velocity } from '@virtcon2/network-world-entities';
import { getTextureFromTextureId } from '../config/SpriteMap';
import { GameState } from '../scenes/Game';
import { defineQuery, defineSystem, enterQuery, exitQuery, World } from '@virtcon2/bytenetc';

const spriteQuery = defineQuery(Sprite, Position);
const spriteQueryEnter = enterQuery(spriteQuery);
const spriteQueryExit = exitQuery(spriteQuery);

export const createSpriteRegisterySystem = (world: World, scene: Phaser.Scene) => {
  return defineSystem<GameState>((state) => {
    const enterEntities = spriteQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const texId = Sprite.texture[id];
      const texture = getTextureFromTextureId(texId);
      if (!texture) {
        console.error('Texture not found for id: ' + texId);
        continue;
      }
      const sprite = Sprite.dynamicBody[id]
        ? scene.physics.add.sprite(Position.x[id], Position.y[id], texture.textureName)
        : scene.add.sprite(Position.x[id], Position.y[id], texture.textureName);

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
      console.log('sprite', sprite);
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
    return state;
  });
};

const spritePosQuery = defineQuery(Sprite, Position, Velocity);

export const createSpriteSystem = (world: World) => {
  return defineSystem<GameState>((state) => {
    const spriteEntities = spritePosQuery(world);
    for (let i = 0; i < spriteEntities.length; i++) {
      const id = spriteEntities[i];
      const sprite = state.spritesById[id];
      if (sprite && Velocity.x[id] === 0 && Velocity.y[id] === 0) {
        sprite.setPosition(Position.x[id], Position.y[id]);
        sprite.setRotation(Sprite.rotation[id] || 0);
      }
    }

    for (let i = 0; i < spriteEntities.length; i++) {
      const id = spriteEntities[i];
      const sprite = state.spritesById[id] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (sprite && sprite.body) {
        sprite.body.setVelocity(Velocity.x[id], Velocity.y[id]);
      }
    }
    return state;
  });
};
