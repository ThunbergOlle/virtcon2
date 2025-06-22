import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import { getTextureFromTextureId, getVariantName, Player, Sprite, Velocity } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';
import { setMainPlayerEntity } from './MainPlayerSystem';

export const createPlayerSystem = (world: World, mainPlayerId: number, scene: Phaser.Scene) => {
  const playerQuery = defineQuery(Player(world), Sprite(world), Velocity(world));
  const playerQueryEnter = enterQuery(playerQuery);

  return defineSystem<GameState>((state) => {
    const enterEntities = playerQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const eid = enterEntities[i];
      console.log(
        `Player ${Player(world).userId[eid]} has entered the world. Is main player: ${
          Player(world).userId[eid] === mainPlayerId
        } (mainPlayer: ${mainPlayerId}), total players: ${enterEntities.length}`,
      );
      if (Player(world).userId[eid] === mainPlayerId) {
        setMainPlayerEntity(world, eid);
      }
    }

    const entities = playerQuery(world);
    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      const isWalking = Math.abs(Velocity(world).x[id]) > 0 || Math.abs(Velocity(world).y[id]) > 0;
      const sprite = state.spritesById[id];
      if (sprite) {
        const texture = getTextureFromTextureId(Sprite(world).texture[id]);
        if (!texture) throw new Error('Texture not found for id: ' + Sprite(world).texture[id]);

        const textureName = getVariantName(texture, Sprite(world).variant[id]);
        const currentPlaying = sprite.anims.currentAnim?.key;

        const animationPrefix = `${textureName}_anim`;
        const walkAnimationName = `${animationPrefix}_walk`;
        const idleAnimationName = `${animationPrefix}_idle`;

        if (currentPlaying !== walkAnimationName && currentPlaying !== idleAnimationName && sprite.anims.isPlaying) {
          continue;
        }

        const animationName = isWalking ? walkAnimationName : idleAnimationName;
        sprite.anims.play(animationName, true);

        if (Velocity(world).x[id] !== 0) sprite.flipX = Velocity(world).x[id] < 0;
      }
    }

    return state;
  });
};
