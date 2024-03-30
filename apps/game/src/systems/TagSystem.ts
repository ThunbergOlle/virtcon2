import { defineQuery, defineSystem, enterQuery, exitQuery, IWorld, Not } from 'bitecs';
import { Position } from '../components/Position';
import { Tag } from '../components/Tag';
import { GameState } from '../scenes/Game';
import { MainPlayer } from '../components/MainPlayer';

const tagQuery = defineQuery([Position, Tag, Not(MainPlayer)]);
const tagQueryEnter = enterQuery(tagQuery);
const tagQueryExit = exitQuery(tagQuery);

export const createTagSystem = (scene: Phaser.Scene) => {
  return defineSystem((world: IWorld, state: GameState) => {
    const enterEntities = tagQueryEnter(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const tag = state.tagById[id];
      const gameObject = scene.add.text(Position.x[id], Position.y[id], tag, {
        fontSize: '8px',
        stroke: '#000',
        resolution: 5,
        align: 'center',
      });
      state.tagGameObjectById[id] = gameObject;
    }

    const entities = tagQuery(world);
    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      const gameObject = state.tagGameObjectById[id];
      gameObject.setPosition(Position.x[id] - 8, Position.y[id] - 16);
    }

    const exitEntities = tagQueryExit(world);
    for (let i = 0; i < exitEntities.length; i++) {
      const id = exitEntities[i];
      const gameObject = state.tagGameObjectById[id];
      if (gameObject) {
        gameObject.destroy();
        delete state.tagGameObjectById[id];
      }
    }

    return { world, state };
  });
};
