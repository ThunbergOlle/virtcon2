
import { BuildingType } from "@shared";
import { ItemType } from "@shared";
import { TileCoordinates } from "../../ui/lib/coordinates";
import { Building,  } from "../buildings/Building";
import { FactoryIO, IOType } from "../buildings/IOBuilding";
import Item from "../item/Item";
import { Factory } from "./Factory";
export class Furnace extends Factory  {

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
