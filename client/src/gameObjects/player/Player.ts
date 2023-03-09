import { Physics } from "phaser";
import PlayerController from "./PlayerController";
import Item from "../item/Item";
import { PlayerEvents } from "./events/PlayerEvents";
import { BuildingItem } from "../item/BuildingItem";

export class Player extends Physics.Arcade.Sprite {
  

  public id: string;
  private inventory = new Array<Item | BuildingItem>();
  public inventorySize: number = 1000;

  constructor(scene: Phaser.Scene, playerId: string) {
    const name = "player-" + playerId;
    super(scene, 0, 0, "player_character");
    this.setName(name);
    this.id = playerId;

    this.scene.physics.add.existing(this);
    this.scene.add.existing(this); 
      
    
  }
  
  public addToInventory(item: Item) {
    const currentInventorySize = this.getCurrentInventorySize();

    if (currentInventorySize + item.amount > this.inventorySize) {
      // TODO: Implement better way to handle this
      console.log("Inventory full");
      return;
    }
    const sameTypeItem = this.inventory.find((i) => i.type == item.type);
    if (sameTypeItem) sameTypeItem.amount += item.amount;
    else this.inventory.push(item);
  }
  
  public removeFromInventory(item: Item) {
    const sameTypeItem = this.getInventory().find((i) => i.type == item.type);
    if (sameTypeItem) {
      sameTypeItem.amount -= item.amount;
      if (sameTypeItem.amount <= 0) {
        this.inventory = this.getInventory().filter((i) => i.type != item.type);
      }
    }
  }
  public getCurrentInventorySize(): number {
    return this.inventory.reduce((acc, item) => acc + item.amount, 0);
  }
  public getInventory(): Item[] {
    return this.inventory;
  }
  public destroy(){
    super.destroy();
  }

}
