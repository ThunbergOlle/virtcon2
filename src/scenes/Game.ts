import { Scene, Tilemaps } from "phaser";

import { BuildingSystem } from "../systems/BuildingSystem";
import { Pipe } from "../gameObjects/buildings/Pipe";
import { Furnace } from "../gameObjects/factory/Furnace";
import { BuildingItem } from "../gameObjects/item/BuildingItem";
import Item, { ItemType } from "../gameObjects/item/Item";
import { Player } from "../gameObjects/player/Player";
import { SceneStates } from "./interfaces";
import { ClockSystem } from "../systems/ClockSystem";
// import { debugDraw } from '../utils/debug'

export default class Game extends Scene implements SceneStates {
  private map!: Tilemaps.Tilemap;

  public static mainPlayer: Player;
  public static clockSystem: ClockSystem;
  public static buildingSystem: BuildingSystem;
  
  // * Ticks per second, read more in ClockSystem.ts
  public tps = 1;

  
  constructor() {
    super("game");
    Game.buildingSystem = new BuildingSystem(this);
  }

  disableKeys() {
    this.input.keyboard.enabled = false;
  }

  enableKeys() {
    this.input.keyboard.enabled = true;
  }

  create() {
    Game.clockSystem = new ClockSystem(this.tps);

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
    Game.mainPlayer.addToInventory(new BuildingItem(this, ItemType.BUILDING_PIPE, 1, [0, 90, 180, 270]))

    Game.buildingSystem.setupCollisions();
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
    Game.clockSystem.update(t, dt);
  }

  spawnFactories() {
    const furnace = new Furnace(this, 1, 10, 10)
    furnace.addToInventory(new Item(this, ItemType.COAL, 10));
    furnace.addToInventory(new Item(this, ItemType.SAND, 10));

    const connectedPipe = new Pipe(this, 2, 11, 10);
    connectedPipe.source.push(furnace);
    furnace.destination = connectedPipe;

    Game.buildingSystem.addBuilding(furnace);
    Game.buildingSystem.addBuilding(connectedPipe);
    
    
  }
}
