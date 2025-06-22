import { defineQuery, defineSystem, enterQuery, exitQuery, World } from '@virtcon2/bytenetc';
import { ConnectionPoint, fromPhaserPos, GameObjectGroups, toPhaserPos } from '@virtcon2/network-world-entities';
import Game, { GameState } from '../scenes/Game';

export const createConnectionSystem = (world: World, game: Game) => {
  const connectionPointQuery = defineQuery(ConnectionPoint);
  const connectionPointEnterQuery = enterQuery(connectionPointQuery);
  const connectionPointExitQuery = exitQuery(connectionPointQuery);

  return defineSystem<GameState>((state) => {
    const enterEntities = connectionPointEnterQuery(world);
    const entities = connectionPointQuery(world);
    const exitEntities = connectionPointExitQuery(world);
    const scene = game as Phaser.Scene;

    for (let i = 0; i < enterEntities.length; i++) {
      const { x, y } = toPhaserPos({
        x: ConnectionPoint(world).startX[enterEntities[i]],
        y: ConnectionPoint(world).startY[enterEntities[i]],
      });
      const startPoint = scene.add.circle(x, y, 3, 0xff0000);

      const { x: endX, y: endY } = toPhaserPos({
        x: ConnectionPoint(world).endX[enterEntities[i]],
        y: ConnectionPoint(world).endY[enterEntities[i]],
      });
      const endPoint = scene.add.circle(endX, endY, 3, 0xff0000);
      scene.physics.add.existing(endPoint);

      const line = scene.add.line(0, 0, startPoint.x, startPoint.y, endPoint.x, endPoint.y, 0xff0000);
      line.setOrigin(0);

      game.state.worldConnectionPointById[enterEntities[i]] = { startPoint, endPoint, line };
    }

    for (let i = 0; i < entities.length; i++) {
      if (ConnectionPoint(world).followMouse[entities[i]]) {
        const { x: endX, y: endY } = fromPhaserPos({ x: scene.input.activePointer.worldX, y: scene.input.activePointer.worldY });
        ConnectionPoint(world).endX[entities[i]] = endX;
        ConnectionPoint(world).endY[entities[i]] = endY;

        const { x, y } = toPhaserPos({ x: endX, y: endY });

        game.state.worldConnectionPointById[entities[i]].endPoint.setPosition(x, y);
        game.state.worldConnectionPointById[entities[i]].line.setTo(
          game.state.worldConnectionPointById[entities[i]].startPoint.x,
          game.state.worldConnectionPointById[entities[i]].startPoint.y,
          x,
          y,
        );

        const endPoint = game.state.worldConnectionPointById[entities[i]].endPoint;
        if (scene.physics.collide(endPoint, state.gameObjectGroups[GameObjectGroups.BUILDING] || [])) {
          ConnectionPoint(world).valid[entities[i]] = 1;
          game.state.worldConnectionPointById[entities[i]].line.setStrokeStyle(2, 0x00ff00);
          game.state.worldConnectionPointById[entities[i]].endPoint.setFillStyle(0x00ff00);
        } else {
          ConnectionPoint(world).valid[entities[i]] = 0;
          game.state.worldConnectionPointById[entities[i]].line.setStrokeStyle(2, 0xff0000);
          game.state.worldConnectionPointById[entities[i]].endPoint.setFillStyle(0xff0000);
        }
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
};
