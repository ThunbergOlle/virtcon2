import { events } from "../../events/Events";
import Game from "../../scenes/Game";
import { Player } from "./Player";


export default class MainPlayerController {
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

    // * -1 ≥ yVel ≤ 1
    const yVel: number = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);

    let ySpeed = yVel*this.speed;
    let xSpeed = xVel*this.speed;

    // Normalize speed in the diagonals
    if (ySpeed !== 0 && xSpeed !== 0) {
      ySpeed = ySpeed/2
      xSpeed = xSpeed/2
    }


    this.player.setVelocityY(ySpeed);
    this.player.setVelocityX(xSpeed);

    // calculate new position
    const newX = this.player.x + xSpeed * dt;
    const newY = this.player.y + ySpeed * dt;
    if (this.player.x !== newX || this.player.y !== newY) {

      Game.network.socket.emit("playerMove", this.player);
    }

  }
  destroy(){
    events.unsubscribe("tick", () => {
      console.log(`Unsubcribed from tick`)
    });
  }
}
