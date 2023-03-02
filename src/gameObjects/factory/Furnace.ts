
import Item, { ItemType } from "../item/Item";
import { Factory, FactoryType } from "./Factory";

export class Furnace extends Factory  {
  public destination: Factory | null = null;
  public source: Factory[] = [];

  public requiredForProcessing: Item[] = [
    new Item(this.scene, ItemType.WOOD, 1)
  ];
  public processingTicks: number = 2;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, FactoryType.FURNACE, x, y);
  }
}
