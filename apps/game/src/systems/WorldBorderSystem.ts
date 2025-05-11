import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import { GameState } from '../scenes/Game';
import { WorldBorder, Sprite, fromPhaserPos, Position } from '@virtcon2/network-world-entities';
import { store } from '../store';
import { select, WindowType } from '../ui/lib/WindowSlice';
import { expandPlotVar } from '../ui/windows/plot/PlotWindow';

const worldBorderQuery = defineQuery(Sprite, WorldBorder, Position);
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
        const { x, y } = fromPhaserPos({ x: Position.x[enterEntities[i]], y: Position.y[enterEntities[i]] });
        expandPlotVar({ side: WorldBorder.side[enterEntities[i]], x, y });
        store.dispatch(select(WindowType.VIEW_EXPAND_PLOT_WINDOW));
      });
    }

    return state;
  });
};
