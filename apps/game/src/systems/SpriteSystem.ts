import { Position, Sprite, Velocity, getTextureFromTextureId, getVariantName, Item } from '@virtcon2/network-world-entities';

import Game, { debugMode, GameState } from '../scenes/Game';
import { defineQuery, defineSystem, enterQuery, exitQuery, Not, World } from '@virtcon2/bytenetc';

export const createSpriteRegisterySystem = (world: World, scene: Phaser.Scene) => {
  const spriteQuery = defineQuery(Sprite, Position);
  const spriteQueryEnter = enterQuery(spriteQuery);
  const spriteQueryExit = exitQuery(spriteQuery);

  const game = Game.getInstance();

  return defineSystem<GameState>((state) => {
    const exitEntities = spriteQueryExit(world);
    for (let i = 0; i < exitEntities.length; i++) {
      const id = exitEntities[i];
      const sprite = state.spritesById[id];
      if (sprite) {
        sprite.destroy();
        delete state.spritesById[id];
      }
    }

    const enterEntities = spriteQueryEnter(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const texId = Sprite(world).texture[id];
      const texture = getTextureFromTextureId(texId);
      if (!texture) {
        console.error('Texture not found for id: ' + texId);
        continue;
      }

      const textureName = getVariantName(texture, Sprite(world).variant[id] || 0);

      if (!scene.textures.exists(textureName)) {
        console.error('Texture not found: ' + textureName);
        continue;
      }

      const sprite = Sprite(world).dynamicBody[id]
        ? scene.physics.add.sprite(Position(world).x[id], Position(world).y[id], textureName)
        : scene.add.sprite(Position(world).x[id], Position(world).y[id], textureName);

      sprite.setDataEnabled();
      sprite.setData('entityId', id);
      sprite.setDepth(Sprite(world).depth[id] + Position(world).y[id]);

      if (texture.animations) {
        for (let i = 0; i < texture.animations.length; i++) {
          const animation = texture.animations[i];
          const animationKey = textureName + '_anim_' + animation.name;

          console.log(`Creating animation: ${animationKey} for texture: ${textureName}`);

          const existingAnimations = scene.anims.get(animationKey);
          if (!existingAnimations)
            scene.anims.create({
              key: animationKey,
              frames: scene.anims.generateFrameNumbers(textureName, { frames: animation.frames }),
              frameRate: animation.frameRate,
              repeat: animation.repeat,
            });
          if (animation.playOnCreate) {
            sprite.anims.play(textureName + '_anim_' + animation.name);
          }
        }
      }

      if (Sprite(world).height[id] && Sprite(world).width[id]) {
        sprite.setDisplaySize(Sprite(world).width[id], Sprite(world).height[id]);
      }

      if (Sprite(world).opacity[id]) {
        sprite.setAlpha(Sprite(world).opacity[id]);
      }

      state.spritesById[id] = sprite;
    }

    return state;
  });
};

export const createMovingSpriteSystem = (world: World) => {
  const movingSpriteQuery = defineQuery(Sprite, Position, Velocity);
  const nonMovingSpriteQuery = defineQuery(Sprite, Position, Not(Velocity), Not(Item));

  return defineSystem<GameState>((state) => {
    const movingSpriteEntities = movingSpriteQuery(world);
    const nonMovingSpriteEntities = nonMovingSpriteQuery(world);

    const spriteEntities = [...movingSpriteEntities, ...nonMovingSpriteEntities];
    for (let i = 0; i < spriteEntities.length; i++) {
      const id = spriteEntities[i];
      const sprite = state.spritesById[id];
      if (sprite) {
        const activeTweens = sprite.scene.tweens.getTweensOf(sprite);

        if (activeTweens.length === 0 && Velocity(world).x[id] === 0 && Velocity(world).y[id] === 0) {
          sprite.setPosition(Position(world).x[id], Position(world).y[id]);
          sprite.setRotation(Sprite(world).rotation[id] * (Math.PI / 180));
          sprite.setDepth(Sprite(world).depth[id] + Position(world).y[id]);
        }
      }
    }

    for (let i = 0; i < movingSpriteEntities.length; i++) {
      const id = movingSpriteEntities[i];
      const sprite = state.spritesById[id] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (sprite && sprite.body) {
        sprite.body.setVelocity(Velocity(world).x[id], Velocity(world).y[id]);
        sprite.setDepth(Sprite(world).depth[id] + Position(world).y[id]);
      }
    }
    return state;
  });
};
