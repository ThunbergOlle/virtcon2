import { defineQuery, defineSystem, World } from '@virtcon2/bytenetc';
import { Animation, Sprite, Position, getTextureFromTextureId } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';

/**
 * Client-side system that controls sprite animations based on the Animation component.
 * Reads animationIndex to determine which animation to play from TextureMetaData.animations.
 * Uses isPlaying to start/stop animations.
 */
export const createAnimationSystem = (world: World) => {
  const animatedQuery = defineQuery(Animation, Sprite, Position);

  return defineSystem<GameState>((state) => {
    const entities = animatedQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const sprite = state.spritesById[eid];
      if (!sprite) continue;

      const texId = Sprite(world).texture[eid];
      const texture = getTextureFromTextureId(texId);
      if (!texture || !texture.animations) continue;

      const animationIndex = Animation(world).animationIndex[eid];
      const isPlaying = Animation(world).isPlaying[eid];

      const variant = Sprite(world).variant[eid] || 0;

      const animationData = texture.animations[animationIndex];
      if (!animationData) continue;

      const animationKey = `${texture.textureName}_${variant}_anim_${animationData.name}`;

      if (isPlaying === 1) {
        // Play animation (ignoreIfPlaying=true to avoid redundant calls)
        sprite.anims.play(animationKey, true);
      } else {
        sprite.anims.stop();
      }
    }

    return state;
  });
};
