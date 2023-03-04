
import Item, { ItemType } from "../item/Item";
import { Building, BuildingType } from "../buildings/Building";
import { Factory } from "./Factory";

export class Furnace extends Factory  {
  public inventorySize: number = 50;
  outputItems: Item = new Item(this.scene, ItemType.GLASS, 1);
  public destination: Building | null = null;
  public source: Building[] = [];

  public requiredForProcessing: Item[] = [
    new Item(this.scene, ItemType.COAL, 10),
    new Item(this.scene, ItemType.SAND, 5)
  ];
  public processingTicks: number = 10

  constructor(scene: Phaser.Scene,id: number, x: number, y: number) {
    super(scene, id, BuildingType.FURNACE, x, y);
  }
}
