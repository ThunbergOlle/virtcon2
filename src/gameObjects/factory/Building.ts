import { Physics } from "phaser";
import Item from "../item/Item";
import { events } from "../../events/Events";

export enum BuildingType {
  STONE_DRILL = "stone_drill",
  FURNACE = "furnace",
}

export abstract class Building extends Physics.Arcade.Sprite {
  public id: number;
  public buildingType: BuildingType;
  public scene: Phaser.Scene;

  private inventory = new Array<Item>();

  public abstract destination: Building | null;
  public abstract source: Building[];

  public abstract processingTicks: number;
  public abstract requiredForProcessing: Item[];

  protected isProcessing: boolean = false;
  protected processingTicksLeft: number = 0;

  constructor(
    scene: Phaser.Scene,
    id: number,
    type: BuildingType,
    x: number,
    y: number
  ) {
    super(scene, x, y, type.toString());
    this.buildingType = type;
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.id = id;
    const gameObject = this.scene.physics.add.existing(this);
    this.scene.add.existing(this);

    this.setInteractive();
    gameObject.setImmovable(true);

    this.setupListeners();
  }
  setupListeners() {
    this.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      events.notify("onBuildingClicked", this);
      console.log("pointerdown");
    });
  }
  /* Eject item is run if there is no destination */
  protected ejectItem(item: Item): void {
    // drop the item on the grown
    item.spawnGameObject(this.x, this.y); // TOOD: Change this to be destination direction.
  }
  public onItemReceive(item: Item) {
    this.addToInventory(item);
  }

  public getInventory(): Item[] {
    return this.inventory;
  }
  /**
   *
   * @param item The item to add to the inventory.
   */
  public addToInventory(item: Item): void {
    const itemWithSameType = this.inventory.find((i) => i.type == item.type);
    if (itemWithSameType) {
      itemWithSameType.amount += item.amount;
    } else {
      this.inventory.push(item);
    }
  }

  public removeFromInventory(item: Item): void {
    const itemWithSameType = this.inventory.find((i) => i.type == item.type);
    if (itemWithSameType) {
      itemWithSameType.amount -= item.amount;
      if (itemWithSameType.amount <= 0) {
        this.inventory = this.inventory.filter((i) => i != itemWithSameType);
      }
    }
  }

  /**
   *
   * @returns true if the factory can process the items in its inventory.
   */
  protected canProcess(): boolean {
    return this.requiredForProcessing.every((item) => {
      const itemInInventory = this.inventory.find((i) => i.type == item.type);
      return itemInInventory ? itemInInventory.amount >= item.amount : false;
    });
  }

  protected onProcessingFinished(): void {
    console.log("Processing finished for " + this.buildingType);
  }
  protected onBeginProcessing(): void {
    this.processingTicksLeft = this.processingTicks;
    this.isProcessing = true;
  }
  public tick(): void {
    if (this.isProcessing) {
      this.processingTicksLeft--;
      if (this.processingTicksLeft <= 0) {
        this.isProcessing = false;
        this.onProcessingFinished();
      }
    } else if (this.canProcess()) {
      this.onBeginProcessing();
    }
  }
}
