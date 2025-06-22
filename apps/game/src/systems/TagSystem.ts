import { debugEntity, defineQuery, defineSystem, enterQuery, exitQuery, Not, World } from '@virtcon2/bytenetc';
import { GameState } from '../scenes/Game';
import { MainPlayer, Position, Tag } from '@virtcon2/network-world-entities';

const tagQuery = defineQuery(Tag, Not(MainPlayer));
const tagQueryEnter = enterQuery(tagQuery);
const tagQueryExit = exitQuery(tagQuery);

export const createTagSystem = (world: World, scene: Phaser.Scene) => {
  return defineSystem<GameState>((state) => {
    const enterEntities = tagQueryEnter(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const playerSprite = state.spritesById[id];
      if (!playerSprite) continue;

      const encodedTag = Tag.value[id];
      const tag = new TextDecoder().decode(encodedTag);

      const gameObject = scene.add
        .text(Position.x[id], Position.y[id], tag, {
          fontSize: '28px',
          backgroundColor: '#808080',
          color: '#ffffff',
          padding: { x: 10, y: 5 },
          align: 'center',
        })
        .setAlpha(0.8)
        .setScale(0.1)
        .setOrigin(0.5, 0.5)
        .setDepth(Number.MAX_SAFE_INTEGER);

      state.tagGameObjectById[id] = gameObject;
    }

    const entities = tagQuery(world);
    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      const follow = state.spritesById[id];
      const tag = state.tagGameObjectById[id];
      tag.setPosition(follow.x, follow.y - 12);
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

    return state;
  });
};
