import Game from "../../scenes/Game";
import { TileCoordinates } from "../../ui/lib/coordinates";
import { Building, BuildingType } from "../buildings/Building";

import Item from "../item/Item";
import { FactoryIO, IOBuilding } from "./IOBuilding";

export class Pipe extends IOBuilding {
  public io: FactoryIO = {
    left: { building: null, io: null },
    right: { building: null, io: null },
    top: { building: null, io: null },
    bottom: { building: null, io: null },
  };
  public rotation = 0;
  public inventorySize = 5;
  public destination: Building | null = null;
  public source: Building[] = [];

  public requiredForProcessing: Item[] = [];
  public processingTicks: number = 2;

  constructor(scene: Phaser.Scene, id: number, pos: TileCoordinates, rotation: number) {
    super(scene, id, BuildingType.PIPE, pos, rotation);
    this.setupInOut();
  }
  setupInOut(){
    // setup the io for the pipe based on the rotation
    const surroundingBuildings = Game.buildingSystem.getSurrondingBuildings(this)
    console.log("surrounding buildings", surroundingBuildings)
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
