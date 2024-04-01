import { IWorld, addComponent, defineQuery, defineSystem, enterQuery } from 'bitecs';

import { Collider, MainPlayer, Player, Position, Sprite, Velocity } from '@virtcon2/network-world-entities';
import { events } from '../events/Events';
import { GameObjectGroups, GameState } from '../scenes/Game';

const speed = 750;
const mainPlayerQuery = defineQuery([MainPlayer, Position, Sprite, Player, Collider]);
const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);
export const createMainPlayerSystem = (scene: Phaser.Scene, cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
  const [keyW, keyA, keyS, keyD] = [
    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
  ];

  return defineSystem<[], [IWorld, GameState]>(([world, state]) => {
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

      // Add keys
    }
    const entities = mainPlayerQuery(world);
    for (let i = 0; i < entities.length; i++) {
      let xVel: number =
        (Number(cursors.right.isDown || scene.input.keyboard.checkDown(keyD)) - Number(cursors.left.isDown || scene.input.keyboard.checkDown(keyA))) / 10;
      let yVel: number =
        (Number(cursors.down.isDown || scene.input.keyboard.checkDown(keyS)) - Number(cursors.up.isDown || scene.input.keyboard.checkDown(keyW))) / 10;

      // Normalize speed in the diagonals
      if (yVel !== 0 && xVel !== 0) {
        yVel = yVel / 2;
        xVel = xVel / 2;
      }

      Velocity.x[entities[i]] = xVel * speed;
      Velocity.y[entities[i]] = yVel * speed;
    }
    return [world, state];
  });
};

export const setMainPlayerEntity = (world: IWorld, eid: number) => {
  addComponent(world, MainPlayer, eid);
  /* Add collider to entity */
  addComponent(world, Collider, eid);
  Collider.offsetX[eid] = 0;
  Collider.offsetY[eid] = 0;
  Collider.sizeWidth[eid] = 16;
  Collider.sizeHeight[eid] = 16;
  Collider.scale[eid] = 1;
  Collider.group[eid] = GameObjectGroups.PLAYER;
};
