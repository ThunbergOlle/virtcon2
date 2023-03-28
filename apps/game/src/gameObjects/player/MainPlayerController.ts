import { NetworkPacketData, PacketType, PlayerMovePacketData, UseNetworkPacket } from '@virtcon2/network-packet';
import { events } from '../../events/Events';
import Game from '../../scenes/Game';
import { Player } from './Player';

export default class MainPlayerController {
  public speed = 100;
  private player: Player;
  private scene: Phaser.Scene;
  private keys: Phaser.Types.Input.Keyboard.CursorKeys;
  private isMoving: boolean = false;
  constructor(scen: Phaser.Scene, player: Player) {
    this.player = player;
    this.scene = scen;
    this.keys = this.scene.input.keyboard.createCursorKeys();
  }
  update(t: number, dt: number) {
    this.player.setVelocity(0, 0);

    // get player input, update position of player

    // * -1 ≥ xVel ≤ 1
    let xVel: number = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);

    // * -1 ≥ yVel ≤ 1
    let yVel: number = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);

    // Normalize speed in the diagonals
    if (yVel !== 0 && xVel !== 0) {
      yVel = yVel / 2;
      xVel = xVel / 2;
    }

    const ySpeed = yVel * this.speed;
    const xSpeed = xVel * this.speed;

    this.player.setVelocityY(ySpeed);
    this.player.setVelocityX(xSpeed);

    // calculate new position
    const newX = this.player.x + xSpeed * dt;
    const newY = this.player.y + ySpeed * dt;
    if (this.player.x !== newX || this.player.y !== newY) {
      console.log('MY NEW POSITION: ', newX, newY);
      const packet: NetworkPacketData<PlayerMovePacketData> = {
        data: {
          player_id: this.player.id,
          position: [this.player.x, this.player.y],
        },
        packet_type: PacketType.PLAYER_MOVE,
        world_id: Game.worldId,
      };

      Game.network.sendPacket(packet);
      this.isMoving = true;
    } else if (this.isMoving) {
      const packet: NetworkPacketData<PlayerMovePacketData> = {
        data: {
          player_id: this.player.id,
          position: [newX, newY],
        },
        packet_type: PacketType.PLAYER_SET_POSITION,
        world_id: Game.worldId,
      };
      this.isMoving = false;

      Game.network.sendPacket(packet);
    }
  }
  destroy() {}
}
