import Phaser from "phaser";

import { Furnace } from "../gameObjects/factory/Furnace";
import Item, { ItemType } from "../gameObjects/item/Item";
import { Player } from "../gameObjects/player/Player";
import { SceneStates } from "./interfaces";
import { BuildingSystem } from "../gameObjects/buildings/BuildingSystem";
import { Pipe } from "../gameObjects/buildings/Pipe";
import { toPhaserPos } from "../ui/lib/coordinates";
// import { debugDraw } from '../utils/debug'

export default class Game extends Phaser.Scene implements SceneStates {
  private map!: Phaser.Tilemaps.Tilemap;
  public static mainPlayer: Player;
  private buildingSystem: BuildingSystem = new BuildingSystem(this, 1);
  
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

    Game.mainPlayer = new Player(this, "main");
    this.buildingSystem.setupCollisions();
    new Item(this, ItemType.WOOD, 10).spawnGameObject(8, 10);

    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    this.cameras.main.startFollow(Game.mainPlayer, false);
    this.cameras.main.setZoom(4);
    this.spawnFactories();
  }
  preload() {}
  update(t: number, dt: number) {
    // handle player movement
    if (this.input.keyboard.enabled) {
      Game.mainPlayer.update(t, dt);
    }
    this.buildingSystem.update(t, dt);
  }
  spawnFactories() {
    
    const furnace = new Furnace(this, 1, 10, 10)
    furnace.addToInventory(new Item(this, ItemType.COAL, 10));
    furnace.addToInventory(new Item(this, ItemType.SAND, 10));

    const connectedPipe = new Pipe(this, 2, 11, 10);
    connectedPipe.source.push(furnace);
    furnace.destination = connectedPipe;

    this.buildingSystem.addBuilding(furnace);
    this.buildingSystem.addBuilding(connectedPipe);
    
    
  }
}
