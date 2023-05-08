import { Scene, Tilemaps } from 'phaser';

import { BuildingItem } from '../gameObjects/item/BuildingItem';
import Item from '../gameObjects/item/Item';
import { BuildingSystem } from '../systems/building/BuildingSystem';
import { SceneStates } from './interfaces';

import { ItemName, WorldSettings, worldMapParser } from '@shared';
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
  public static worldId = '';

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
      Game.network.join(worldId);
    });
    events.subscribe('networkLoadWorld', ({ world, player }) => {
      console.log('Loading world data...');
      this.map = this.make.tilemap({
        tileWidth: 16,
        tileHeight: 16,
        width: world.height_map.length,
        height: world.height_map[0].length,
        data: worldMapParser(world.height_map),
      });
      const tileSet = this.map.addTilesetImage('OutdoorsTileset', 'tiles', 16, 16, 0, 0);

      this.map.layers.forEach((layer, index) => {
        this.map.createLayer(index, tileSet, 0, 0);
      });

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

      world.resources.forEach((resource) => {
        new Item(this, ItemName.WOOD, 10).spawnGameObject({ x: resource.x, y: resource.y });
      });

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
