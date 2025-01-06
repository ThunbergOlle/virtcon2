import { defineQuery, defineSystem, enterQuery, exitQuery, World } from '@virtcon2/bytenetc';
import { ConnectionPoint, fromPhaserPos, toPhaserPos } from '@virtcon2/network-world-entities';
import Game, { GameState } from '../scenes/Game';

const connectionPointQuery = defineQuery(ConnectionPoint);
const connectionPointEnterQuery = enterQuery(connectionPointQuery);
const connectionPointExitQuery = exitQuery(connectionPointQuery);

export const createConnectionSystem = (world: World, game: Game) =>
  defineSystem<GameState>((state) => {
    const enterEntities = connectionPointEnterQuery(world);
    const entities = connectionPointQuery(world);
    const exitEntities = connectionPointExitQuery(world);
    const scene = game as Phaser.Scene;

    for (let i = 0; i < enterEntities.length; i++) {
      const { x, y } = toPhaserPos({ x: ConnectionPoint.startX[enterEntities[i]], y: ConnectionPoint.startY[enterEntities[i]] });
      const startPoint = scene.add.circle(x, y, 3, 0xff0000);

      const { x: endX, y: endY } = toPhaserPos({
        x: ConnectionPoint.endX[enterEntities[i]] || scene.input.activePointer.x,
        y: ConnectionPoint.endY[enterEntities[i]] || scene.input.activePointer.y,
      });
      const endPoint = scene.add.circle(endX, endY, 3, 0xff0000);

      const line = scene.add.line(0, 0, startPoint.x, startPoint.y, endPoint.x, endPoint.y, 0xff0000);
      line.setOrigin(0);

      game.state.worldConnectionPointById[enterEntities[i]] = { startPoint, endPoint, line };
    }

    for (let i = 0; i < entities.length; i++) {
      if (!ConnectionPoint.endX[entities[i]] && !ConnectionPoint.endY[entities[i]]) {
        const { x, y } = toPhaserPos(fromPhaserPos({ x: scene.input.activePointer.worldX, y: scene.input.activePointer.worldY }));
        game.state.worldConnectionPointById[entities[i]].endPoint.setPosition(x, y);
        game.state.worldConnectionPointById[entities[i]].line.setTo(
          game.state.worldConnectionPointById[entities[i]].startPoint.x,
          game.state.worldConnectionPointById[entities[i]].startPoint.y,
          x,
          y,
        );
      }
    }

    for (let i = 0; i < exitEntities.length; i++) {
      const { startPoint, endPoint, line } = game.state.worldConnectionPointById[exitEntities[i]];
      startPoint.destroy();
      endPoint.destroy();
      line.destroy();
      delete game.state.worldConnectionPointById[exitEntities[i]];
    }
    return state;
  });
