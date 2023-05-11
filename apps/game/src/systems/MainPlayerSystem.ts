import { IWorld, defineQuery, defineSystem, enterQuery } from '@virtcon2/virt-bit-ecs';
import { Cameras } from 'phaser';
import { Sprite } from '../components/Sprite';

import { MainPlayer } from '../components/MainPlayer';
import { Position } from '../components/Position';
import Game, { GameState } from '../scenes/Game';
import { Velocity } from '../components/Velocity';
import { NetworkPacketData, PacketType, PlayerMovePacketData } from '@virtcon2/network-packet';
import { Player } from '../components/Player';

const mainPlayerQuery = defineQuery([MainPlayer, Position, Sprite, Player]);
const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);
export const createMainPlayerSystem = (camera: Cameras.Scene2D.Camera, cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
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
      }
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

      Velocity.x[entities[i]] = xVel;
      Velocity.y[entities[i]] = yVel;

      const newX = Position.x[entities[i]] + xVel * state.dt;
      const newY = Position.y[entities[i]] + yVel * state.dt;

      if (Position.x[entities[i]] !== newX || Position.y[entities[i]] !== newY) {
        Position.x[entities[i]] = newX;
        Position.y[entities[i]] = newY;
        const packet: NetworkPacketData<PlayerMovePacketData> = {
          data: {
            player_id: state.playerById[Player.player[entities[i]]],
            position: [newX, newY],
          },
          packet_type: PacketType.PLAYER_SET_POSITION,
          world_id: state.world_id,
        };
        Game.network.sendPacket(packet);
      }
    }
    return { world, state };
  });
};
