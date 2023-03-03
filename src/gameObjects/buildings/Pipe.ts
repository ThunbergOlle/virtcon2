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
    if (this.destination) {
      for (let item of this.getInventory()) {
        this.destination.onItemReceive(item);
      }
    } else {
      for (let item of this.getInventory()) {
        this.ejectItem(item);
      }
    }
  }
  canProcess(): boolean {
    if(this.getInventory().length > 0) {
      return true;
    } 
    return false;
  }
}
