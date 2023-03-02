import { GameObjects, Physics } from "phaser";
import PlayerController from "./PlayerController";

export class Player extends Physics.Arcade.Sprite {
  public controller: PlayerController
  constructor(scene: Phaser.Scene, playerId: string) {
    const name = "player-" + playerId;
    super(scene, 0, 0, "player_character");
    this.setName(name);

    this.scene.physics.add.existing(this);
    this.scene.add.existing(this); 
      
    
    this.controller = new PlayerController(scene, this); // create new character controller
  }
  update(t: number, dt: number){
    this.controller.update(t, dt); // update character controller
  }

}
