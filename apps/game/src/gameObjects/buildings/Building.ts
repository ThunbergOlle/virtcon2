import { Physics } from 'phaser';
import Item from '../item/Item';
import { events } from '../../events/Events';
import { TileCoordinates, fromPhaserPos, toPhaserPos } from '../../ui/lib/coordinates';
import {BuildingType} from '@shared';



export abstract class Building extends Physics.Arcade.Sprite {
  public isUIVisable: boolean = false;
  public id: number;
  public buildingType: BuildingType;
  public scene: Phaser.Scene;

  public tilePos: TileCoordinates = { x: 0, y: 0 };

  private inventory = new Array<Item>();
  public abstract inventorySize: number;

  public abstract processingTicks: number;
  public abstract requiredForProcessing: Item[];

  protected isProcessing: boolean = false;
  public processingTicksLeft: number = 0;

  constructor(scene: Phaser.Scene, id: number, type: BuildingType, pos: TileCoordinates, rotation: number = 0) {
    const { x, y } = toPhaserPos({ x: pos.x, y: pos.y });
    super(scene, x, y, type.toString());

    /* Building variables */
    this.buildingType = type;
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.tilePos = pos;
    this.id = id;

    /* Run setup functions */
    this.setupListeners();
    this.setupBuilding(rotation);
  }
  setupBuilding(rotation: number) {
    const gameObject = this.scene.physics.add.existing(this);
    this.scene.add.existing(this);

    this.setInteractive();
    gameObject.setImmovable(true);
    gameObject.setRotation(rotation);
  }

  setupListeners() {
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      events.notify('onBuildingClicked', this);
      this.isUIVisable = true;
    });
    events.subscribe('tick', () => {
      this.tick();
    });
  }
  /* Eject item is run if there is no destination */
  protected ejectItem(item: Item): void {
    const { x, y } = fromPhaserPos({ x: this.x, y: this.y });
    // drop the item on the grown
    item.spawnGameObject({x, y}); // TODO: Change this to be destination direction.
    this.removeFromInventory(item);
  }
  public onItemReceive(item: Item) {
    this.addToInventory(item);
  }

  public getInventory(): Item[] {
    return this.inventory;
  }

  public getCurrentInventorySize(): number {
    return this.inventory.reduce((acc, item) => acc + item.amount, 0);
  }
  /**
   * Adds an item to the inventory.
   * In most cases, use onItemReceive instead. OnItemReceive will call this method.
   * @param item The item to add to the inventory.
   */
  public addToInventory(item: Item): void {
    if (this.getCurrentInventorySize() + item.amount > this.inventorySize) {
      console.log('Inventory full'); // TODO: Implement better way to handle this
      return;
    }
    const itemWithSameType = this.inventory.find((i) => i.type === item.type);
    if (itemWithSameType) {
      itemWithSameType.amount += item.amount;
    } else {
      this.inventory.push(item);
    }
  }

  public removeFromInventory(item: Item): void {
    const itemWithSameType = this.inventory.find((i) => i.type === item.type);

    if (itemWithSameType) {
      itemWithSameType.amount -= item.amount;
      if (itemWithSameType.amount <= 0) {
        this.inventory = this.inventory.filter((i) => i !== itemWithSameType);
      }
    }
  }

  /**
   *
   * @returns true if the factory can process the items in its inventory.
   */
  protected canProcess(): boolean {
    return this.requiredForProcessing.every((item) => {
      const isInInventory = this.inventory.find((i) => i.type === item.type);
      const canProcess: boolean = isInInventory ? isInInventory.amount >= item.amount : false;
      return canProcess;
    });
  }

  protected onProcessingFinished(): void {
    console.log('Processing finished for ' + this.buildingType);
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
