import { Physics } from "phaser";
import PlayerController from "./PlayerController";
import Item from "../item/Item";
import { PlayerEvents } from "./PlayerEvents";
import { BuildingItem } from "../item/BuildingItem";

export class Player extends Physics.Arcade.Sprite {
  public controller: PlayerController
  public events: PlayerEvents
  
  private inventory = new Array<Item | BuildingItem>();
  public inventorySize: number = 1000;

  constructor(scene: Phaser.Scene, playerId: string) {
    const name = "player-" + playerId;
    super(scene, 0, 0, "player_character");
    this.setName(name);

    this.scene.physics.add.existing(this);
    this.scene.add.existing(this); 
      
    this.controller = new PlayerController(scene, this); // create new character controller
    this.events = new PlayerEvents(scene, this);
  }
 
  update(t: number, dt: number){
    this.controller.update(t, dt); // update character controller
  }
  public addToInventory(item: Item) {
    const currentInventorySize = this.getCurrentInventorySize();

    if (currentInventorySize + item.amount > this.inventorySize) {
      // TODO: Implement better way to handle this
      if (currentInventorySize >= this.inventorySize) console.log("Inventory full");
      else console.log(`The inventory can't hold ${item.amount} items.`)
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

}
