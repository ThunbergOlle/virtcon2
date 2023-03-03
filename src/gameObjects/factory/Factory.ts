import Item from "../item/Item";
import { Building, BuildingType } from "./Building";

export abstract class Factory extends Building {
    abstract outputItems: Item;
    constructor(scene: Phaser.Scene, id: number, type: BuildingType, x: number, y: number) {
        super(scene, id, type, x, y);
        
    }
    onProcessingFinished() {
        // remove the items that were used for processing
        for (let item of this.requiredForProcessing) {
            this.removeFromInventory(item)
        }
        if (this.destination) {
            this.destination.onItemReceive(this.outputItems);
        }
        else {
            console.log("No destination for item");
        }
        super.onProcessingFinished();
    }
    
    
}