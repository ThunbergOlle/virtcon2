import { Building, BuildingType } from "../buildings/Building";
import Item from "../item/Item";

export class Pipe extends Building {
  public rotation = 0;
  public inventorySize = 5;
  public destination: Building | null = null;
  public source: Building[] = [];

  public requiredForProcessing: Item[] = [];
  public processingTicks: number = 2;

  constructor(scene: Phaser.Scene, id: number, x: number, y: number, rotation: number) {
    super(scene, id, BuildingType.PIPE, x, y, rotation);
  }
  onProcessingFinished() {
    for (let item of this.getInventory()) {
        if (this.destination) this.destination.onItemReceive(item);
        else this.ejectItem(item);
    }
  }
  canProcess(): boolean {
    return this.getInventory().length > 0;
  }
}
