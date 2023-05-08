import { ItemName } from "@shared";
import { events } from "../../events/Events";
import Game from "../../scenes/Game";
import { TileCoordinates, toPhaserPos } from "../../ui/lib/coordinates";



export default class Item {
  public type: ItemName;
  public amount: number;
  public gameObject: Phaser.GameObjects.Sprite | null = null;

  protected scene: Phaser.Scene;

  public position = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, type: ItemName, amount: number) {
    this.scene = scene;
    this.type = type;
    this.amount = amount;
  }

  spawnGameObject(pos: TileCoordinates) {
    const { x, y } = toPhaserPos({ x: pos.x, y: pos.y }) ;
    if (this.gameObject != null) this.gameObject.destroy();

    /* Add the sprite to the scene */
    const sprite = this.scene.physics.add.sprite(
      x,
      y,
      this.type.toString()
    );

    sprite.setScale(0.8);
    // add collision between item and player. if collision, add item to inventory
    this.scene.physics.add.overlap(
      Game.mainPlayer.body.gameObject,
      sprite,
      () => {
        // TODO: implement pickup logic
        sprite.destroy();
      }
    );

  }
}
