import { Building, Collider, Position } from '@virtcon2/network-world-entities';
import { Types } from 'phaser';
import Game, { debugMode, GameState } from '../scenes/Game';
import { store } from '../store';
import { select, WindowType } from '../ui/lib/WindowSlice';
import { inspectBuilding } from '../ui/windows/building/inspectedBuildingSlice';
import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';

export const createBuildingSystem = (world: World) => {
  const buildingQuery = defineQuery(Building, Position, Collider);
  const buildingQueryEnter = enterQuery(buildingQuery);

  return defineSystem<GameState>((state) => {
    const enterEntities = buildingQueryEnter(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const sprite = state.spritesById[id] as Types.Physics.Arcade.SpriteWithDynamicBody;
      if (sprite) {
        setupBuildingEventListeners(world, sprite, id, state);
      }
    }

    return state;
  });
};

const setupBuildingEventListeners = (world: World, sprite: Types.Physics.Arcade.SpriteWithDynamicBody, eid: number, state: GameState) => {
  const game = Game.getInstance();
  if (!sprite.body) {
    console.error(`No body for building ${eid}`);
    return;
  }

  sprite.setInteractive(game.input.makePixelPerfect());
  if (debugMode() && sprite.body?.gameObject) game.input.enableDebug(sprite.body.gameObject);

  sprite.body.gameObject.on(Phaser.Input.Events.POINTER_DOWN, () => {
    store.dispatch(inspectBuilding(Building(world).worldBuildingId[eid]));
    store.dispatch(select(WindowType.VIEW_BUILDING));
  });
};
