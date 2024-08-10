import { MainPlayer, Player, Sprite, Velocity } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';
import { setMainPlayerEntity } from './MainPlayerSystem';
import { defineQuery, defineSystem, enterQuery, Not, World } from '@virtcon2/bytenetc';
import { getTextureFromTextureId } from '../config/SpriteMap';

const playerQuery = defineQuery(Player, Sprite, Velocity);
const playerQueryEnter = enterQuery(playerQuery);

export const createPlayerSystem = (world: World, mainPlayerId: number) => {
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
        const textureName = getTextureFromTextureId(Sprite.texture[id])?.textureName;
        const animationPrefix = `${textureName}_anim`;
        const animationName = `${animationPrefix}_${isWalking ? 'walk' : 'idle'}`;

        sprite.anims.play(animationName, true);
        if (Velocity.x[id] !== 0) sprite.flipX = Velocity.x[id] < 0;
      }
    }

    return state;
  });
};
