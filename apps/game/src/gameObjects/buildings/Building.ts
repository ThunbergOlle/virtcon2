import { BuildingType } from '@shared';
import { Physics } from 'phaser';
import { events } from '../../events/Events';
import { TileCoordinates, toPhaserPos } from '../../ui/lib/coordinates';
import Item from '../item/Item';

export abstract class Building extends Physics.Arcade.Sprite {
  public isUIVisable: boolean = false;
  public id: number;
  public buildingType: BuildingType;
  public scene: Phaser.Scene;

  public tilePos: TileCoordinates = { x: 0, y: 0 };

  private inventory = new Array<Item>();
  public abstract inventorySize: number;

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
}
