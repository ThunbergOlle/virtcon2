import { Scene, Tilemaps } from 'phaser';

import { Pipe } from '../gameObjects/buildings/Pipe';
import { Furnace } from '../gameObjects/factory/Furnace';
import { BuildingItem } from '../gameObjects/item/BuildingItem';
import Item from '../gameObjects/item/Item';
import { Player } from '../gameObjects/player/Player';
import { BuildingSystem } from '../systems/BuildingSystem';
import { ClockSystem } from '../systems/ClockSystem';
import { SceneStates } from './interfaces';

import { Network } from '../networking/Network';
import { events } from '../events/Events';
import { MainPlayer } from '../gameObjects/player/MainPlayer';






export default class Game extends Scene implements SceneStates {
  private map!: Tilemaps.Tilemap;

  public static network: Network;
  public static mainPlayer: MainPlayer;
  public static clockSystem: ClockSystem;
  public static buildingSystem: BuildingSystem;

  // * Ticks per second, read more in ClockSystem.ts
  public static tps = 20;

  constructor() {
    super('game');
    Game.buildingSystem = new BuildingSystem(this);

  }

  disableKeys() {
    this.input.keyboard.enabled = false;
  }

  enableKeys() {
    this.input.keyboard.enabled = true;
  }

  create() {
    Game.network = new Network();
    events.subscribe('joinWorld',(worldId) => {

      console.log('creating scene');
      this.physics.world.createDebugGraphic();

      /* TODO: fetch this data from the backend */
      this.map = this.make.tilemap({ key: 'tilemap' });
      const tileSet = this.map.addTilesetImage('OutdoorsTileset', 'tiles', 16, 16, 0, 0);

      this.map.layers.forEach((layer, index) => {
        this.map.createLayer(index, tileSet, 0, 0);
      });
      Game.network.join(worldId);
    })
    events.subscribe('networkLoadWorld', (world) => {
      console.log("Loading world data...")

      Game.clockSystem = new ClockSystem(Game.tps);

      const mainPlayer = world.player

      // setup players
      for (const player of world.players) {
        const newPlayer = new Player(this, player.id);
        newPlayer.setPosition(player.pos.x, player.pos.y);
      }

      Game.mainPlayer = new MainPlayer(this, mainPlayer.id);
      Game.mainPlayer.setPosition(mainPlayer.pos.x, mainPlayer.pos.y);
      Game.mainPlayer.addToInventory(new BuildingItem(this, ItemType.BUILDING_PIPE, 1, [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]));
      this.spawnFactories();

      Game.buildingSystem.setupCollisions();
      Game.buildingSystem.setupIO();
      new Item(this, ItemType.WOOD, 10).spawnGameObject({ x: 8, y: 10 });

      this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

      this.cameras.main.startFollow(Game.mainPlayer, false);
      this.cameras.main.setZoom(4);
    });
    events.subscribe('networkNewPlayer', (player) => {
      const newPlayer = new Player(this, player.id);
      newPlayer.setPosition(player.pos.x, player.pos.y);
    })

  }
  preload() {}
  update(t: number, dt: number) {

    // handle player movement
    if (this.input.keyboard.enabled && Game.mainPlayer) {
      Game.mainPlayer.update(t, dt);
    }
    if (Game.clockSystem){
      Game.clockSystem.update(t, dt);
    }

  }

  spawnFactories() {
    const furnace = new Furnace(this, 1, { x: 10, y: 10 });
    furnace.addToInventory(new Item(this, ItemType.COAL, 10));
    furnace.addToInventory(new Item(this, ItemType.SAND, 10));

    const connectedPipe = new Pipe(this, 2, { x: 11, y: 10 }, 0);
    connectedPipe.source.push(furnace);
    furnace.destination = connectedPipe;

    Game.buildingSystem.addBuilding(furnace);
    Game.buildingSystem.addBuilding(connectedPipe);
  }
}
