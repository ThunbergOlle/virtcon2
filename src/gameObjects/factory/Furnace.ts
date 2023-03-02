
import Item, { ItemType } from "../item/Item";
import { BuildingType } from "./Building";
import { Factory } from "./Factory";

export class Furnace extends Factory  {
  public destination: Factory | null = null;
  public source: Factory[] = [];

  public requiredForProcessing: Item[] = [
    new Item(this.scene, ItemType.WOOD, 1)
  ];
  public processingTicks: number = 2;

  constructor(scene: Phaser.Scene,id: number, x: number, y: number) {
    super(scene, id, BuildingType.FURNACE, x, y);
  }
}
