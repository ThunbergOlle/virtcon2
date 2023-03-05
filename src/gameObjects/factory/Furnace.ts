
import Item, { ItemType } from "../item/Item";
import { Building, BuildingType } from "../buildings/Building";
import { TileCoordinates } from "../../ui/lib/coordinates";
import { FactoryIO, IOBuilding, IOType } from "../buildings/IOBuilding";

export class Furnace extends IOBuilding  {
  
  public io: FactoryIO = {
    left: {building: null, io: IOType.INPUT},
    right: {building: null, io: IOType.OUTPUT},
    top: {building: null, io: null},
    bottom: {building: null, io: null},
  };

  public inventorySize: number = 50;
  outputItems: Item = new Item(this.scene, ItemType.GLASS, 1);
  public destination: Building | null = null;
  public source: Building[] = [];

  public requiredForProcessing: Item[] = [
    new Item(this.scene, ItemType.COAL, 10),
    new Item(this.scene, ItemType.SAND, 5)
  ];
  public processingTicks: number = 10

  constructor(scene: Phaser.Scene,id: number, pos: TileCoordinates) {
    super(scene, id, BuildingType.FURNACE, pos);
    this.setupInOut();
  }
}
