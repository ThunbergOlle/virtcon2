import { IWorld, addComponent, addEntity, defineQuery, defineSystem, enterQuery } from '@virtcon2/virt-bit-ecs';
import { Sprite } from '../components/Sprite';

import { Collider } from '../components/Collider';
import { MainPlayer } from '../components/MainPlayer';
import { Player } from '../components/Player';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { events } from '../events/Events';
import { GameState } from '../scenes/Game';
import { ServerPlayer } from '@shared';

const speed = 750;
const mainPlayerQuery = defineQuery([MainPlayer, Position, Sprite, Player, Collider]);
const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);
export const createMainPlayerSystem = (scene: Phaser.Scene, cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
  return defineSystem((world: IWorld, state: GameState, _) => {
    const enterEntities = mainPlayerQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const texture = state.spritesById[id];
      if (texture && texture.body) {
        /* Follow the main character */
        scene.cameras.main.startFollow(texture);
        scene.cameras.main.setZoom(3);
      }
      /* Add event listeners */
      /* Event listener for inventory event */
      scene.input.keyboard.on('keydown-E', () => {
        events.notify('onInventoryButtonPressed');
      });
      /* Event listener for crafter event */
      scene.input.keyboard.on('keydown-C', () => {
        events.notify('onCrafterButtonPressed');
      });
    }
    const entities = mainPlayerQuery(world);
    for (let i = 0; i < entities.length; i++) {
      let xVel: number = (Number(cursors.right.isDown) - Number(cursors.left.isDown)) / 10;
      let yVel: number = (Number(cursors.down.isDown) - Number(cursors.up.isDown)) / 10;

      // Normalize speed in the diagonals
      if (yVel !== 0 && xVel !== 0) {
        yVel = yVel / 2;
        xVel = xVel / 2;
      }

      Velocity.x[entities[i]] = xVel * speed;
      Velocity.y[entities[i]] = yVel * speed;
    }
    return { world, state };
  });
};

export const createNewMainPlayerEntity = (state: GameState, ecsWorld: IWorld, serverPlayer: ServerPlayer) => {
  const mainPlayer = addEntity(ecsWorld);
  addComponent(ecsWorld, Position, mainPlayer);
  Position.x[mainPlayer] = 200;
  Position.y[mainPlayer] = 200;
  addComponent(ecsWorld, Velocity, mainPlayer);
  Velocity.x[mainPlayer] = 0;
  Velocity.y[mainPlayer] = 0;
  addComponent(ecsWorld, Sprite, mainPlayer);
  Sprite.texture[mainPlayer] = 0;
  addComponent(ecsWorld, MainPlayer, mainPlayer);
  addComponent(ecsWorld, Player, mainPlayer);
  state.playerById[mainPlayer] = serverPlayer.id;
  Player.player[mainPlayer] = mainPlayer;
  /* Add collider to entity */
  addComponent(ecsWorld, Collider, mainPlayer);
  Collider.offsetX[mainPlayer] = 0;
  Collider.offsetY[mainPlayer] = 0;
  Collider.sizeWidth[mainPlayer] = 16;
  Collider.sizeHeight[mainPlayer] = 16;
  Collider.scale[mainPlayer] = 1;
}
