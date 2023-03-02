import Phaser from "phaser";
import { Furnace } from "../gameObjects/factory/Furnace";
import Item, { ItemType } from "../gameObjects/item/Item";
import { Player } from "../gameObjects/player/Player";
import { SceneStates } from "./interfaces";
import { Factory } from "../gameObjects/factory/Factory";
import { FactorySystem } from "../gameObjects/factory/FactorySystem";
// import { debugDraw } from '../utils/debug'

export default class Game extends Phaser.Scene implements SceneStates {
  private map!: Phaser.Tilemaps.Tilemap;
  private mainPlayer!: Player;
  private factorySystem: FactorySystem = new FactorySystem(1);
  
  constructor() {
    super("game");
  }

  disableKeys() {
    this.input.keyboard.enabled = false;
  }

  enableKeys() {
    this.input.keyboard.enabled = true;
  }

  create() {
    console.log("creating scene");
    this.physics.world.createDebugGraphic();

    this.map = this.make.tilemap({ key: "tilemap" });
    let tileSet = this.map.addTilesetImage(
      "OutdoorsTileset",
      "tiles",
      16,
      16,
      0,
      0
    );

    this.map.layers.forEach((layer, index) => {
      this.map.createLayer(index, tileSet, 0, 0);
    });

    this.mainPlayer = new Player(this, "main");

    new Item(this, ItemType.WOOD, 10).spawnGameObject(100, 100);

    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    this.cameras.main.startFollow(this.mainPlayer, false);
    this.cameras.main.setZoom(4);
    this.spawnFactories();
  }
  preload() {}
  update(t: number, dt: number) {
    // handle player movement
    if (this.input.keyboard.enabled) {
      this.mainPlayer.update(t, dt);
    }
    this.factorySystem.update(t, dt);
  }
  spawnFactories() {
    const furnace = new Furnace(this, 136, 136)
    furnace.addToInventory(new Item(this, ItemType.WOOD, 1));
    this.factorySystem.factories.push(furnace);
    
  }
}
