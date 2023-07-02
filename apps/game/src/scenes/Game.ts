import { Scene, Tilemaps } from 'phaser';

import { SceneStates } from './interfaces';

import { RedisWorld, RedisWorldBuilding, RedisWorldResource, ServerPlayer, worldMapParser } from '@shared';
import { get_resource_by_item_name } from '@virtcon2/static-game-data';
import { events } from '../events/Events';

import { JoinPacketData } from '@virtcon2/network-packet';
import { IWorld, System, createWorld } from '@virtcon2/virt-bit-ecs';
import { Network } from '../networking/Network';
import { createBuildingPlacementSystem } from '../systems/BuildingPlacementSystem';
import { createBuildingSystem, createNewBuildingEntity, handlePlaceBuildingPackets } from '../systems/BuildingSystem';
import { createColliderSystem } from '../systems/ColliderSystem';
import { createMainPlayerSystem, createNewMainPlayerEntity } from '../systems/MainPlayerSystem';
import { createNewPlayerEntity, createPlayerReceiveNetworkSystem } from '../systems/PlayerReceiveNetworkSystem';
import { createPlayerSendNetworkSystem } from '../systems/PlayerSendNetworkSystem';
import { createNewResourceEntity, createResourceSystem } from '../systems/ResourceSystem';
import { createSpriteRegisterySystem, createSpriteSystem } from '../systems/SpriteSystem';

export enum GameObjectGroups {
  PLAYER = 0,
  BUILDING = 1,
  RESOURCE = 2,
  TERRAIN = 3,
}
export interface GameState {
  dt: number;
  world_id: string;
  spritesById: { [key: number]: Phaser.GameObjects.Sprite };
  playerById: { [key: number]: string };
  buildingById: { [key: number]: RedisWorldBuilding };
  resourcesById: { [key: number]: RedisWorldResource } /* entity id to resource id string in database */;
  gameObjectGroups: {
    [key in GameObjectGroups]: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup | null;
  };
}
export default class Game extends Scene implements SceneStates {
  public world?: IWorld;
  private map!: Tilemaps.Tilemap;

  public state: GameState = {
    dt: 0,
    world_id: '',
    spritesById: {},
    playerById: {},
    resourcesById: {},
    buildingById: {},
    gameObjectGroups: {
      [GameObjectGroups.PLAYER]: null,
      [GameObjectGroups.BUILDING]: null,
      [GameObjectGroups.RESOURCE]: null,
      [GameObjectGroups.TERRAIN]: null,
    },
  };
  public spriteSystem?: System<GameState>;
  public spriteRegisterySystem?: System<GameState>;
  public mainPlayerSystem?: System<GameState>;
  public playerReceiveNetworkSystem?: System<GameState>;
  public playerSendNetworkSystem?: System<GameState>;
  public colliderSystem?: System<GameState>;
  public resourceSystem?: System<GameState>;
  public buildingPlacementSystem?: System<GameState>;
  public buildingSystem?: System<GameState>;

  public static network: Network;

  // * Ticks per second, read more in ClockSystem.ts
  public static tps = 1;
  public static worldId = '';

  /* Singelton pattern */
  private static instance: Game;
  public static getInstance(): Game {
    return Game.instance;
  }
  constructor() {
    if (Game.instance) {
      return Game.instance;
    }
    super('game');
    Game.instance = this;
  }

  disableKeys() {
    this.input.keyboard.enabled = false;
  }

  enableKeys() {
    this.input.keyboard.enabled = true;
  }

  create() {
    Game.network = new Network();
    this.state.gameObjectGroups = {
      [GameObjectGroups.PLAYER]: this.physics.add.group(),
      [GameObjectGroups.BUILDING]: this.physics.add.staticGroup(),
      [GameObjectGroups.RESOURCE]: this.physics.add.staticGroup(),
      [GameObjectGroups.TERRAIN]: this.physics.add.staticGroup(),
    };

    this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], this.state.gameObjectGroups[GameObjectGroups.BUILDING] ?? []);
    this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], this.state.gameObjectGroups[GameObjectGroups.RESOURCE] ?? []);
    this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], this.state.gameObjectGroups[GameObjectGroups.TERRAIN] ?? []);

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
      this.spriteRegisterySystem = createSpriteRegisterySystem(this);
      this.mainPlayerSystem = createMainPlayerSystem(this, this.input.keyboard.createCursorKeys());
      this.playerReceiveNetworkSystem = createPlayerReceiveNetworkSystem();
      this.playerSendNetworkSystem = createPlayerSendNetworkSystem();
      this.colliderSystem = createColliderSystem(this);
      this.resourceSystem = createResourceSystem();
      this.buildingPlacementSystem = createBuildingPlacementSystem(this);
      this.buildingSystem = createBuildingSystem();

      this.map = this.make.tilemap({
        tileWidth: 16,
        tileHeight: 16,
        data: worldMapParser(world.height_map),
      });

      const tileSet = this.map.addTilesetImage('OutdoorsTileset', 'tiles', 16, 16, 1);

      this.map.layers.forEach((layer, index) => {
        const new_layer = this.map.createLayer(index, tileSet, 0, 0);
        new_layer.setCollisionBetween(32, 34);
        this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], new_layer);
      });


      this.setupWorld(ecsWorld, world, player);
    });
  }
  setupWorld(ecsWorld: IWorld, world: RedisWorld, player: ServerPlayer) {
    world.resources.forEach((resource) => {
      const resourceName = get_resource_by_item_name(resource.item.name);
      if (!resourceName) {
        console.log(`Resource ${resource.item.name} not found in static game data.`);
        return;
      }

      const resourceEntityId = createNewResourceEntity(ecsWorld, {
        pos: { x: resource.x, y: resource.y },
        resourceName: resourceName,
      });
      this.state.resourcesById[resourceEntityId] = resource;
    });

    world.buildings.forEach((building) => {
      createNewBuildingEntity(ecsWorld, this.state, building);
    });

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    createNewMainPlayerEntity(this.state, ecsWorld, player);

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
      !this.resourceSystem ||
      !this.buildingPlacementSystem ||
      !this.buildingSystem
    )
      return;

    let newState = { ...this.state, dt: dt };
    const packets = Game.network.get_received_packets();

    /* Handle packets. */
    /* Sometimes, we want to handle the packets before running through the systems */

    newState = handlePlaceBuildingPackets(this.world, this.state, packets);

    newState = this.spriteRegisterySystem(this.world, newState, packets).state;
    newState = this.colliderSystem(this.world, newState, packets).state;
    newState = this.mainPlayerSystem(this.world, newState, packets).state;
    newState = this.playerReceiveNetworkSystem(this.world, newState, packets).state;
    newState = this.spriteSystem(this.world, newState, packets).state;
    newState = this.resourceSystem(this.world, newState, packets).state;
    newState = this.buildingSystem(this.world, newState, packets).state;
    newState = this.buildingPlacementSystem(this.world, newState, packets).state;
    newState = this.playerSendNetworkSystem(this.world, newState, packets).state;

    // Update state
    this.state = newState;

    Game.network.clear_received_packets();
  }

  static destroy() {
    if (Game.network) Game.network.disconnect();
    events.unsubscribe('joinWorld', () => {});
    events.unsubscribe('networkLoadWorld', () => {});
  }
}
