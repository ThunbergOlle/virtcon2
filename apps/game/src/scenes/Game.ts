import { Scene, Tilemaps } from 'phaser';

import { Pipe } from '../gameObjects/buildings/Pipe';
import { Furnace } from '../gameObjects/factory/Furnace';
import { BuildingItem } from '../gameObjects/item/BuildingItem';
import Item from '../gameObjects/item/Item';
import { BuildingSystem } from '../systems/building/BuildingSystem';
import { SceneStates } from './interfaces';

import { ItemType } from '@shared';
import { events } from '../events/Events';
import { MainPlayer } from '../gameObjects/player/MainPlayer';
import { PlayerSystem } from '../systems/player/PlayerSystem';
import { Network } from './networking/Network';

export default class Game extends Scene implements SceneStates {
  private map!: Tilemaps.Tilemap;

  public static network: Network;
  public static mainPlayer: MainPlayer;
  public static buildingSystem: BuildingSystem;
  public static playerSystem: PlayerSystem;

  // * Ticks per second, read more in ClockSystem.ts
  public static tps = 1;
  public static worldId = "";

  constructor() {
    super('game');

  }

  disableKeys() {
    this.input.keyboard.enabled = false;
  }

  enableKeys() {
    this.input.keyboard.enabled = true;
  }

  create() {
    Game.network = new Network();

    events.subscribe('joinWorld', (worldId) => {
      console.log('creating scene');
      this.physics.world.createDebugGraphic();

      /* TODO: fetch this data from the backend */
      this.map = this.make.tilemap({ key: 'tilemap' });
      const tileSet = this.map.addTilesetImage('OutdoorsTileset', 'tiles', 16, 16, 0, 0);

      this.map.layers.forEach((layer, index) => {
        this.map.createLayer(index, tileSet, 0, 0);
      });
      Game.network.join(worldId);
    });
    events.subscribe('networkLoadWorld', ({world, player}) => {
      console.log('Loading world data...');

      Game.playerSystem = new PlayerSystem(this);
      Game.buildingSystem = new BuildingSystem(this);
      Game.buildingSystem.setupCollisions();

      const mainPlayer = player;

      // setup players
      for (const player of world.players) {
        if (player.id === mainPlayer.id) {
          continue;
        }
        Game.playerSystem.newPlayer(player);
      }

      Game.mainPlayer = new MainPlayer(this, mainPlayer.id);
      Game.mainPlayer.setPosition(mainPlayer.position[0], mainPlayer.position[1]);
      Game.mainPlayer.addToInventory(new BuildingItem(this, ItemType.BUILDING_PIPE, 1, [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]));

      new Item(this, ItemType.WOOD, 10).spawnGameObject({ x: 8, y: 10 });

      this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

      this.cameras.main.startFollow(Game.mainPlayer, false);
      this.cameras.main.setZoom(4);
    });
  }
  preload() {}
  update(t: number, dt: number) {
    // handle player movement
    if (this.input.keyboard.enabled && Game.mainPlayer) {
      Game.mainPlayer.update(t, dt);
    }
    if (Game.playerSystem) {
      //Game.playerSystem.update(t, dt);
    }
  }

  static destroy() {
    if (Game.network) Game.network.disconnect();
    if (Game.buildingSystem) Game.buildingSystem.destroy();
    if (Game.playerSystem) Game.playerSystem.destroy();
    if (Game.mainPlayer) Game.mainPlayer.destroy();
    events.unsubscribe('joinWorld', () => {});
    events.unsubscribe('networkLoadWorld', () => {});


  }
}
