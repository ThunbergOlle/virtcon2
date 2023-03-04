import { fromPhaserPos, toPhaserPos } from "../../ui/lib/coordinates";

export enum ItemType {
  WOOD = "wood",
  SAND = "sand",
  GLASS = "glass",
  COAL = "coal",
}
export default class Item {
  public type: ItemType;
  public amount: number;
  public gameObject: Phaser.GameObjects.Sprite | null = null;

  private scene: Phaser.Scene;

  public position = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, type: ItemType, amount: number) {
    console.log("item created");
    this.scene = scene;
    this.type = type;
    this.amount = amount;
  }

  spawnGameObject(_x: number, _y: number) {
    const { x, y } = toPhaserPos({ x: _x, y: _y }) ;
    if (this.gameObject != null) {
      console.log("destroying old game object");
      this.gameObject.destroy();
    }

    this.position = new Phaser.Math.Vector2(x, y);

    /* Add the sprite to the scene */
    this.scene.add.sprite(
      this.position.x,
      this.position.y,
      this.type.toString()
    );
  }
}
