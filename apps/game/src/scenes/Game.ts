import { Scene, Tilemaps } from 'phaser';

import { SceneStates } from './interfaces';

import { RedisWorldResource, worldMapParser } from '@shared';
import { ResourceNames } from '@virtcon2/static-game-data';
import { events } from '../events/Events';

import { JoinPacketData } from '@virtcon2/network-packet';
import { IWorld, System, addComponent, addEntity, createWorld } from '@virtcon2/virt-bit-ecs';
import { MainPlayer } from '../components/MainPlayer';
import { Player } from '../components/Player';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { Velocity } from '../components/Velocity';
import { Network } from '../networking/Network';
import { createColliderSystem } from '../systems/ColliderSystem';
import { createMainPlayerSystem } from '../systems/MainPlayerSystem';
import { createNewPlayerEntity, createPlayerReceiveNetworkSystem } from '../systems/PlayerReceiveNetworkSystem';
import { createPlayerSendNetworkSystem } from '../systems/PlayerSendNetworkSystem';
import { createNewResourceEntity, createResourceSystem } from '../systems/ResourceSystem';
import { createSpriteRegisterySystem, createSpriteSystem } from '../systems/SpriteSystem';
import { Collider } from '../components/Collider';

export interface GameState {
  dt: number;
  world_id: string;
  spritesById: { [key: number]: Phaser.GameObjects.Sprite };
  playerById: { [key: number]: string };
  resourcesById: { [key: number]: RedisWorldResource } /* entity id to resource id string in database */;
}
export default class Game extends Scene implements SceneStates {
  private world?: IWorld;
  private map!: Tilemaps.Tilemap;

  public state: GameState = {
    dt: 0,
    world_id: '',
    spritesById: {},
    playerById: {},
    resourcesById: {},
  };
  public spriteSystem?: System<GameState>;
  public spriteRegisterySystem?: System<GameState>;
  public mainPlayerSystem?: System<GameState>;
  public playerReceiveNetworkSystem?: System<GameState>;
  public playerSendNetworkSystem?: System<GameState>;
  public colliderSystem?: System<GameState>;
  public resourceSystem?: System<GameState>;

  public static network: Network;

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
      this.state.world_id = world.id;
      console.log('Loading world data...');

      const ecsWorld = createWorld();
      this.world = ecsWorld;
      this.spriteSystem = createSpriteSystem();
      this.spriteRegisterySystem = createSpriteRegisterySystem(this, ['player_character', 'stone_drill', 'building_furnace', 'building_pipe', 'wood', 'sand', 'glass', 'coal', 'resource_wood']);
      this.mainPlayerSystem = createMainPlayerSystem(this, this.input.keyboard.createCursorKeys());
      this.playerReceiveNetworkSystem = createPlayerReceiveNetworkSystem();
      this.playerSendNetworkSystem = createPlayerSendNetworkSystem();
      this.colliderSystem = createColliderSystem(this);
      this.resourceSystem = createResourceSystem();

      this.map = this.make.tilemap({
        tileWidth: 16,
        tileHeight: 16,
        data: worldMapParser(world.height_map),
      });

      const tileSet = this.map.addTilesetImage('OutdoorsTileset', 'tiles', 16, 16, 1);

      this.map.layers.forEach((layer, index) => {
        const new_layer = this.map.createLayer(index, tileSet, 0, 0);
        new_layer.setCollisionBetween(32, 34);
      });

      world.resources.forEach((resource) => {
        const resourceEntityId = createNewResourceEntity(ecsWorld, {
          pos: { x: resource.x, y: resource.y },
          resourceName: ResourceNames.WOOD,
        });
        this.state.resourcesById[resourceEntityId] = resource;
      });

      this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

      const mainPlayer = addEntity(ecsWorld);
      addComponent(ecsWorld, Position, mainPlayer);
      Position.x[mainPlayer] = 200;
      Position.y[mainPlayer] = 200;
      addComponent(ecsWorld, Velocity, mainPlayer);
      Velocity.x[mainPlayer] = 0;
      Velocity.y[mainPlayer] = 0;
      addComponent(ecsWorld, Sprite, mainPlayer);
      Sprite.texture[mainPlayer] = 0;
      addComponent(ecsWorld, MainPlayer, mainPlayer);
      addComponent(ecsWorld, Player, mainPlayer);
      this.state.playerById[mainPlayer] = player.id;
      Player.player[mainPlayer] = mainPlayer;
      /* Add collider to entity */
      addComponent(ecsWorld, Collider, mainPlayer);
      Collider.offsetX[mainPlayer] = 0;
      Collider.offsetY[mainPlayer] = 0;
      Collider.sizeWidth[mainPlayer] = 16;
      Collider.sizeHeight[mainPlayer] = 16;
      Collider.scale[mainPlayer] = 1;

      /* Load players that are already on the world */
      for (const worldPlayer of world.players) {
        if (worldPlayer.id === player.id) {
          continue;
        }
        const join_packet: JoinPacketData = {
          id: worldPlayer.id,
          position: worldPlayer.position,
          name: 'todo',
          socket_id: '',
        };
        createNewPlayerEntity(join_packet, ecsWorld, this.state);
      }
    });
  }
  preload() {}
  update(t: number, dt: number) {
    if (
      !this.spriteSystem ||
      !this.world ||
      !this.mainPlayerSystem ||
      !this.playerReceiveNetworkSystem ||
      !this.colliderSystem ||
      !this.spriteRegisterySystem ||
      !this.playerSendNetworkSystem ||
      !this.resourceSystem
    )
      return;
    const packets = Game.network.get_received_packets();
    let newState = { ...this.state, dt: dt };
    newState = this.spriteRegisterySystem(this.world, newState, packets).state;
    newState = this.colliderSystem(this.world, newState, packets).state;
    newState = this.mainPlayerSystem(this.world, newState, packets).state;
    newState = this.playerReceiveNetworkSystem(this.world, newState, packets).state;
    newState = this.spriteSystem(this.world, newState, packets).state;
    newState = this.resourceSystem(this.world, newState, packets).state;
    newState = this.playerSendNetworkSystem(this.world, newState, packets).state;
    this.state = newState;
    Game.network.clear_received_packets();
  }

  static destroy() {
    if (Game.network) Game.network.disconnect();
    events.unsubscribe('joinWorld', () => {});
    events.unsubscribe('networkLoadWorld', () => {});
  }
}
