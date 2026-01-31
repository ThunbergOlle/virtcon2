import { Changed, defineQuery, defineSystem, World } from '@virtcon2/bytenetc';
import { Sprite, Position, getTextureFromTextureId, getVariantName } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';

/**
 * Client-side system that detects when sprite textures change and updates the Phaser sprite.
 * Uses the Changed(Sprite) query modifier for efficient change detection.
 */
export const createSpriteTextureUpdateSystem = (world: World, scene: Phaser.Scene) => {
  // Changed() modifier only returns entities where Sprite component values changed
  // This is built into bytenetc - no manual tracking needed
  const changedSpriteQuery = defineQuery(Sprite, Position, Changed(Sprite));

  return defineSystem<GameState>((state) => {
    const changedEntities = changedSpriteQuery(world);

    for (let i = 0; i < changedEntities.length; i++) {
      const id = changedEntities[i];
      const sprite = state.spritesById[id];
      if (!sprite) continue;

      const texId = Sprite(world).texture[id];
      const texture = getTextureFromTextureId(texId);
      if (!texture) continue;

      const textureName = getVariantName(texture, Sprite(world).variant[id] || 0);
      if (scene.textures.exists(textureName)) {
        sprite.setTexture(textureName);
      }

      // Also update display size in case it changed
      const width = Sprite(world).width[id];
      const height = Sprite(world).height[id];
      if (height && width) {
        sprite.setDisplaySize(width, height);
      }
    }

    return state;
  });
};
