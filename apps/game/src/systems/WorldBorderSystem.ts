import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import { GameState } from '../scenes/Game';
import { WorldBorder, Sprite } from '@virtcon2/network-world-entities';

const worldBorderQuery = defineQuery(Sprite, WorldBorder);
const worldBorderQueryEnter = enterQuery(worldBorderQuery);

export const createWorldBorderSystem = (world: World, scene: Phaser.Scene) => {
  return defineSystem<GameState>((state) => {
    const enterEntities = worldBorderQueryEnter(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const sprite = state.spritesById[enterEntities[i]];
      sprite.setInteractive({ useHandCursor: true });
      sprite.body?.gameObject?.on(Phaser.Input.Events.POINTER_OVER, () => scene.input.setDefaultCursor('pointer'));
      sprite.body?.gameObject?.on(Phaser.Input.Events.POINTER_OUT, () => scene.input.setDefaultCursor('default'));
      sprite.body?.gameObject?.on(Phaser.Input.Events.POINTER_DOWN, () => {
        console.log('World border clicked');
      });
    }

    return state;
  });
};
