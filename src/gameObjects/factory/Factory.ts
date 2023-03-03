import Item from "../item/Item";
import { Building, BuildingType } from "../buildings/Building";

export abstract class Factory extends Building {
  abstract outputItems: Item;
  
  public abstract destination: Building | null;
  public abstract source: Building[];

  constructor(
    scene: Phaser.Scene,
    id: number,
    type: BuildingType,
    x: number,
    y: number
  ) {
    super(scene, id, type, x, y);
  }
  onProcessingFinished() {
    // remove the items that were used for processing
    for (let item of this.requiredForProcessing) {
      this.removeFromInventory(item);
    }
    if (this.destination) {
      this.destination.onItemReceive(this.outputItems);
    } else {
    }
    super.onProcessingFinished();
  }
}
