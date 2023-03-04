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

    // TODO: add better movement with less if statements
    if (this.keys.left.isDown) {
      this.player.setVelocityX(-this.speed);
    } else if (this.keys.right.isDown) {
      this.player.setVelocityX(this.speed);
    }
    if (this.keys.up.isDown) {
      this.player.setVelocityY(-this.speed);
    }
    if (this.keys.down.isDown) {
      this.player.setVelocityY(this.speed);
    }
  }
}
