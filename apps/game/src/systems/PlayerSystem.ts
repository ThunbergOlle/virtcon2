import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import { getTextureFromTextureId, getVariantName, Player, Sprite, Velocity } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';
import { setMainPlayerEntity } from './MainPlayerSystem';

const playerQuery = defineQuery(Player, Sprite, Velocity);
const playerQueryEnter = enterQuery(playerQuery);

export const createPlayerSystem = (world: World, mainPlayerId: number, scene: Phaser.Scene) => {
  return defineSystem<GameState>((state) => {
    const enterEntities = playerQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const eid = enterEntities[i];
      console.log(
        `Player ${Player.userId[eid]} has entered the world. Is main player: ${
          Player.userId[eid] === mainPlayerId
        } (mainPlayer: ${mainPlayerId}), total players: ${enterEntities.length}`,
      );
      if (Player.userId[eid] === mainPlayerId) {
        setMainPlayerEntity(world, eid);
      }
    }

    const entities = playerQuery(world);
    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      const isWalking = Math.abs(Velocity.x[id]) > 0 || Math.abs(Velocity.y[id]) > 0;
      const sprite = state.spritesById[id];
      if (sprite) {
        const texture = getTextureFromTextureId(Sprite.texture[id]);
        if (!texture) throw new Error('Texture not found for id: ' + Sprite.texture[id]);

        const textureName = getVariantName(texture, Sprite.variant[id]);
        const currentPlaying = sprite.anims.currentAnim?.key;

        const animationPrefix = `${textureName}_anim`;
        const walkAnimationName = `${animationPrefix}_walk`;
        const idleAnimationName = `${animationPrefix}_idle`;

        if (currentPlaying !== walkAnimationName && currentPlaying !== idleAnimationName && sprite.anims.isPlaying) {
          continue;
        }

        const animationName = isWalking ? walkAnimationName : idleAnimationName;
        sprite.anims.play(animationName, true);

        if (Velocity.x[id] !== 0) sprite.flipX = Velocity.x[id] < 0;
      }
    }

    return state;
  });
};
