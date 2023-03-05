// import Game from "../../scenes/Game";
import { Player } from "./Player";

export default class PlayerController {
  public speed = 100;
  private player: Player;
  private scene: Phaser.Scene;
  private keys: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scen: Phaser.Scene, player: Player) {
    this.player = player;
    this.scene = scen;
    this.keys = this.scene.input.keyboard.createCursorKeys();
  }

  update(t: number, dt: number) {
    this.player.setVelocity(0, 0);

    // get player input, update position of player

    // * -1 ≥ xVel ≤ 1
    const xVel: number = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
    this.player.setVelocityX(xVel*this.speed);

    // * -1 ≥ yVel ≤ 1
    const yVel: number = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);
    this.player.setVelocityY(yVel*this.speed);
  }
}
