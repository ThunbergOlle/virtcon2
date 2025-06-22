import { Position } from '@virtcon2/network-world-entities';

import { GameState } from '../scenes/Game';
import { defineQuery, defineSystem, enterQuery, Entity, exitQuery, World } from '@virtcon2/bytenetc';

const positionQuery = defineQuery(Position);
const positionQueryEnter = enterQuery(positionQuery);
const positionQueryExit = exitQuery(positionQuery);

export const createDebugPositionSystem = (world: World, scene: Phaser.Scene) => {
  const debugTexts: { [id: Entity]: Phaser.GameObjects.Text } = {};
  return defineSystem<GameState>((state) => {
    const exitEntities = positionQueryExit(world);
    for (let i = 0; i < exitEntities.length; i++) {
      if (debugTexts[exitEntities[i]]) {
        debugTexts[exitEntities[i]].destroy();
        delete debugTexts[exitEntities[i]];
      }
    }

    const enterEntities = positionQueryEnter(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      debugTexts[id] = scene.add
        .text(Position.x[id], Position.y[id], id.toString(), {
          fontSize: '28px',
          color: '#ffffff',
          align: 'center',
        })
        .setScale(0.2)
        .setOrigin(0.5, 0.5)
        .setDepth(Number.MAX_SAFE_INTEGER);
    }

    return state;
  });
};
