import { Building } from '../buildings/Building';
import { IOBuilding } from '../buildings/IOBuilding';
import Item from '../item/Item';

export abstract class Factory extends IOBuilding {
  abstract outputItems: Item;

  /* Default IO has to be set on each Factory class */
  public abstract destination: Building | null;
  public abstract source: Building[];


  onProcessingFinished() {
    console.log('Processing finished, adding items to inventory');
    // remove the items that were used for processing
    for (const item of this.requiredForProcessing) {
      this.removeFromInventory(item);
    }

    if (this.destination) this.destination.onItemReceive(this.outputItems);
    super.onProcessingFinished();
  }
}
