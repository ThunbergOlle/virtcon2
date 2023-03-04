import Item, { ItemType } from "../item/Item";
import { Building, BuildingType } from "../buildings/Building";

export class Pipe extends Building {
  public inventorySize = 5;
  public destination: Building | null = null;
  public source: Building[] = [];

  public requiredForProcessing: Item[] = [];
  public processingTicks: number = 2;

  constructor(scene: Phaser.Scene, id: number, x: number, y: number) {
    super(scene, id, BuildingType.PIPE, x, y);
  }
  onProcessingFinished() {
    // ! i have no idea if this will work. In theory it should
    const func = this.destination ? this.destination.onItemReceive : this.ejectItem;
    for (let item of this.getInventory()) {
      func(item)
    }
  }
  canProcess(): boolean {
    return this.getInventory().length > 0;
  }
}
