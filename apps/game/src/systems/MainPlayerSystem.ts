import { IWorld, addComponent, defineQuery, defineSystem, enterQuery } from '@virtcon2/virt-bit-ecs';
import { Cameras } from 'phaser';
import { Sprite } from '../components/Sprite';

import { Collider } from '../components/Collider';
import { MainPlayer } from '../components/MainPlayer';
import { Player } from '../components/Player';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { GameState } from '../scenes/Game';
import { events } from '../events/Events';

const speed = 750;
const mainPlayerQuery = defineQuery([MainPlayer, Position, Sprite, Player]);
const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);
export const createMainPlayerSystem = (scene: Phaser.Scene, camera: Cameras.Scene2D.Camera, cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
  return defineSystem((world: IWorld, state: GameState, _) => {
    const enterEntities = mainPlayerQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const sprite = Sprite.texture[id];
      const texture = state.spritesById[sprite];
      if (texture) {
        /* Follow the main character */
        camera.startFollow(texture);
        camera.setZoom(4);
        /* Add collider to entity */
        addComponent(world, Collider, id);
        Collider.offsetX[id] = 0;
        Collider.offsetY[id] = 0;
        Collider.sizeWidth[id] = 16;
        Collider.sizeHeight[id] = 16;
        Collider.scale[id] = 1;
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
