import { Physics } from 'phaser';
import { BuildingItem } from '../item/BuildingItem';
import Item from '../item/Item';
import { events } from '../../events/Events';
import { ServerPlayer, playerPositionUpdateRate } from '@shared';

export class Player extends Physics.Arcade.Sprite {
  public id: string;
  private inventory = new Array<Item | BuildingItem>();
  public inventorySize: number = 1000;
  public networkPosition = { x: 0, y: 0 };
  constructor(scene: Phaser.Scene, playerId: string) {
    const name = 'player-' + playerId;
    super(scene, 0, 0, 'player_character');
    this.setName(name);
    this.id = playerId;

    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);

    this.setupListeners();
  }

  protected setupListeners() {
    console.log(`Setting up listeners for player ${this.id}`);
    events.subscribe('networkPlayerMove', (player: ServerPlayer) => {
      console.log(`player ${player.id} moved to ${player.pos.x}, ${player.pos.y}`);
      if (player.id === this.id) {
        this.networkPosition = { x: player.pos.x, y: player.pos.y };
        this.scene.physics.moveTo(this, this.networkPosition.x, this.networkPosition.y, 100, 100);
      }
    });
    events.subscribe('networkPlayerDisconnect', (player: ServerPlayer) => {
      if (player.id === this.id) {
        this.destroy();
      }
    });

    /* PlayerStopMovement packet is sent when a player has finished moving. We need to correct it's position. */
    events.subscribe('networkPlayerStopMovement', (player: ServerPlayer) => {
      if (player.id === this.id) {
        setTimeout(() => {
          this.setVelocity(0, 0);
          this.setPosition(player.pos.x, player.pos.y);
        }, playerPositionUpdateRate);
      }
    })
  }
  update(t: number, dt: number) {

  }
  public addToInventory(item: Item) {
    const currentInventorySize = this.getCurrentInventorySize();

    if (currentInventorySize + item.amount > this.inventorySize) {
      // TODO: Implement better way to handle this
      console.log('Inventory full');
      return;
    }
    const sameTypeItem = this.inventory.find((i) => i.type === item.type);
    if (sameTypeItem) sameTypeItem.amount += item.amount;
    else this.inventory.push(item);
  }

  public removeFromInventory(item: Item) {
    const sameTypeItem = this.getInventory().find((i) => i.type === item.type);
    if (sameTypeItem) {
      sameTypeItem.amount -= item.amount;
      if (sameTypeItem.amount <= 0) {
        this.inventory = this.getInventory().filter((i) => i.type !== item.type);
      }
    }
  }
  public getCurrentInventorySize(): number {
    return this.inventory.reduce((acc, item) => acc + item.amount, 0);
  }
  public getInventory(): Item[] {
    return this.inventory;
  }
  public destroy() {
    super.destroy();
  }
}
