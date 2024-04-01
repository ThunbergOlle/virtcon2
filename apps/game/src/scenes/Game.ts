import { Scene, Tilemaps } from 'phaser';
import { Buffer } from 'buffer';
import { SceneStates } from './interfaces';

import { RedisWorldResource, worldMapParser } from '@shared';
import { DBBuilding } from '@virtcon2/static-game-data';
import { events } from '../events/Events';

import { PacketType, ServerPacket, SyncServerEntityPacket } from '@virtcon2/network-packet';
import { DESERIALIZE_MODE, IWorld, System, createWorld, defineDeserializer, defineSerializer, registerComponents } from 'bitecs';
import { Network } from '../networking/Network';
import { createBuildingPlacementSystem } from '../systems/BuildingPlacementSystem';
import { createBuildingSystem } from '../systems/BuildingSystem';
import { createColliderSystem } from '../systems/ColliderSystem';
import { createMainPlayerSystem } from '../systems/MainPlayerSystem';
import { createPlayerSendNetworkSystem } from '../systems/PlayerSendNetworkSystem';
import { createResourceSystem } from '../systems/ResourceSystem';
import { createSpriteRegisterySystem, createSpriteSystem } from '../systems/SpriteSystem';
import { createTagSystem } from '../systems/TagSystem';
import { allComponents, Player } from '@virtcon2/network-world-entities';

export enum GameObjectGroups {
  PLAYER = 0,
  BUILDING = 1,
  RESOURCE = 2,
  TERRAIN = 3,
  BUILDING_NO_COLLIDE = 4,
}
export interface GameState {
  dt: number;
  world_id: string;
  spritesById: { [key: number]: Phaser.GameObjects.Sprite };
  playerById: { [key: number]: string };
  tagGameObjectById: { [key: number]: Phaser.GameObjects.Text };
  resourcesById: { [key: number]: RedisWorldResource } /* entity id to resource id string in database */;
  ghostBuildingById: { [key: number]: DBBuilding };
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
    ghostBuildingById: {},
    tagGameObjectById: {},
    gameObjectGroups: {
      [GameObjectGroups.PLAYER]: null,
      [GameObjectGroups.BUILDING]: null,
      [GameObjectGroups.RESOURCE]: null,
      [GameObjectGroups.TERRAIN]: null,
      [GameObjectGroups.BUILDING_NO_COLLIDE]: null,
    },
  };
  public spriteSystem?: System<[], [IWorld, GameState]>;
  public spriteRegisterySystem?: System<[], [IWorld, GameState]>;
  public mainPlayerSystem?: System<[], [IWorld, GameState]>;
  public playerSendNetworkSystem?: System<[], [IWorld, GameState]>;
  public colliderSystem?: System<[], [IWorld, GameState]>;
  public resourceSystem?: System<[], [IWorld, GameState]>;
  public buildingPlacementSystem?: System<[], [IWorld, GameState]>;
  public buildingSystem?: System<[], [IWorld, GameState]>;
  public tagSystem?: System<[], [IWorld, GameState]>;

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
      [GameObjectGroups.BUILDING_NO_COLLIDE]: this.physics.add.staticGroup(),
    };

    // Add colliders between players and other objects
    this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], this.state.gameObjectGroups[GameObjectGroups.BUILDING] ?? []);
    // this is commented out since we don't want to collide with resources. This may change in the future.
    // this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], this.state.gameObjectGroups[GameObjectGroups.RESOURCE] ?? []);
    this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], this.state.gameObjectGroups[GameObjectGroups.TERRAIN] ?? []);

    events.subscribe('joinWorld', (worldId) => {
      console.log('creating scene');
      this.physics.world.createDebugGraphic();
      Game.network.join(worldId);
    });

    events.subscribe('networkLoadWorld', ({ heightMap, id }) => {
      this.state.world_id = id;
      console.log('Loading world data...');

      const ecsWorld = createWorld();
      this.world = ecsWorld;
      registerComponents(ecsWorld, allComponents);

      this.spriteSystem = createSpriteSystem();
      this.spriteRegisterySystem = createSpriteRegisterySystem(this);
      this.mainPlayerSystem = createMainPlayerSystem(this, this.input.keyboard.createCursorKeys());
      // this.playerReceiveNetworkSystem = createPlayerReceiveNetworkSystem(); - replaced by networked entities
      this.playerSendNetworkSystem = createPlayerSendNetworkSystem();
      this.colliderSystem = createColliderSystem(this);
      this.resourceSystem = createResourceSystem();
      this.buildingPlacementSystem = createBuildingPlacementSystem(this);
      this.buildingSystem = createBuildingSystem();
      this.tagSystem = createTagSystem(this);

      this.map = this.make.tilemap({
        tileWidth: 16,
        tileHeight: 16,
        data: worldMapParser(heightMap),
      });

      const tileSet = this.map.addTilesetImage('OutdoorsTileset', 'tiles', 16, 16, 1);

      this.map.layers.forEach((layer, index) => {
        const new_layer = this.map.createLayer(index, tileSet, 0, 0);
        new_layer.setCollisionBetween(32, 34);
        this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], new_layer);
      });

      this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    });
  }

  preload() {}
  update(t: number, dt: number) {
    if (
      !this.spriteSystem ||
      !this.world ||
      !this.mainPlayerSystem ||
      !this.colliderSystem ||
      !this.spriteRegisterySystem ||
      !this.playerSendNetworkSystem ||
      !this.resourceSystem ||
      !this.buildingPlacementSystem ||
      !this.buildingSystem ||
      !this.tagSystem
    )
      return;

    let newState = { ...this.state, dt: dt };
    const packets = Game.network.get_received_packets();
    receiveServerEntities(this.world, packets);

    newState = this.spriteRegisterySystem([this.world, newState])[1];
    newState = this.colliderSystem([this.world, newState])[1];
    newState = this.mainPlayerSystem([this.world, newState])[1];
    newState = this.spriteSystem([this.world, newState])[1];
    newState = this.resourceSystem([this.world, newState])[1];
    newState = this.buildingSystem([this.world, newState])[1];
    newState = this.buildingPlacementSystem([this.world, newState])[1];
    newState = this.buildingPlacementSystem([this.world, newState])[1];
    newState = this.tagSystem([this.world, newState])[1];

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

const receiveServerEntities = (world: IWorld, packets: ServerPacket<unknown>[]) => {
  const deserialize = defineDeserializer(world); // TODO: move this to a more global scope

  for (let i = 0; i < packets.length; i++) {
    const packet = packets[i];
    if (packet.packet_type === PacketType.SYNC_SERVER_ENTITY) {
      const dataBufferJSON = packet.data as SyncServerEntityPacket;
      const buffer = Buffer.from(dataBufferJSON);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const deserializedEnts = deserialize(world, arrayBuffer);
      console.log(`Received ${deserializedEnts.length} entities from server`);
    }
  }
};
