export enum ItemType {
  WOOD = "wood",
  SAND = "sand",
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

  spawnGameObject(x: number, y: number) {
    if (this.gameObject != null) {
      console.log("destroying old game object");
      this.gameObject.destroy();
    }

    this.position = new Phaser.Math.Vector2(x, y);

    /* Add the sprite to the scene */
    this.scene.add.sprite(
      this.position.x,
      this.position.y,
      "items",
      this.getSpriteSheetIndex()
    );
  }
  getSpriteSheetIndex(): number {
    switch (this.type) {
      case ItemType.WOOD:
        return 0;
      case ItemType.SAND:
        return 1;
    }
  }
}
