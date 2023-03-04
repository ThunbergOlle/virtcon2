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
      this.gameObject.destroy();
    }
    /* Add the sprite to the scene */
    let sprite = this.scene.add.sprite(
      x,
      y,
      this.type.toString()
    );
    sprite.setScale(0.8)
    
  }
}
