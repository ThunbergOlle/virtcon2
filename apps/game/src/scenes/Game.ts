import { Buffer } from 'buffer';
import { Scene, Tilemaps } from 'phaser';
import { SceneStates } from './interfaces';

import { RedisWorldResource, worldMapParser } from '@shared';
import { DBBuilding } from '@virtcon2/static-game-data';
import { events } from '../events/Events';

import { PacketType, ServerPacket, SyncServerEntityPacket } from '@virtcon2/network-packet';
import { allComponents, Player, SerializationID, serializeConfig } from '@virtcon2/network-world-entities';
import { createWorld, defineDeserializer, IWorld, registerComponents, System as DEPRECATED_SYSTEM } from 'bitecs';
import { Network } from '../networking/Network';
import { createBuildingPlacementSystem } from '../systems/BuildingPlacementSystem';
import { createBuildingSystem } from '../systems/BuildingSystem';
import { createColliderSystem } from '../systems/ColliderSystem';
import { createMainPlayerSyncSystem } from '../systems/MainPlayerSyncSystem';
import { createMainPlayerSystem } from '../systems/MainPlayerSystem';
import { createPlayerSystem } from '../systems/PlayerSystem';
import { createResourceSystem } from '../systems/ResourceSystem';
import { createSpriteRegisterySystem, createSpriteSystem } from '../systems/SpriteSystem';
import { createTagSystem } from '../systems/TagSystem';
import { System } from '@virtcon2/bytenetc';

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
  public spriteSystem?: System<GameState>;
  public spriteRegisterySystem?: System<GameState>;
  public mainPlayerSystem?: DEPRECATED_SYSTEM<[], [IWorld, GameState]>;
  public mainPlayerSyncSystem?: DEPRECATED_SYSTEM<[], [IWorld, GameState]>;
  public colliderSystem?: System<GameState>;
  public resourceSystem?: DEPRECATED_SYSTEM<[], [IWorld, GameState]>;
  public buildingPlacementSystem?: System<GameState>;
  public buildingSystem?: System<GameState>;
  public tagSystem?: DEPRECATED_SYSTEM<[], [IWorld, GameState]>;
  public playerSystem?: DEPRECATED_SYSTEM<[], [IWorld, GameState]>;

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

    events.subscribe('networkLoadWorld', ({ heightMap, id, mainPlayerId }) => {
      this.state.world_id = id;
      console.log('Loading world data...');

      const ecsWorld = createWorld();
      this.world = ecsWorld;
      registerComponents(ecsWorld, allComponents);

      this.spriteRegisterySystem = createSpriteRegisterySystem(this);
      this.spriteSystem = createSpriteSystem();
      this.mainPlayerSystem = createMainPlayerSystem(this, this.input.keyboard.createCursorKeys());
      // this.playerReceiveNetworkSystem = createPlayerReceiveNetworkSystem(); - replaced by networked entities
      this.mainPlayerSyncSystem = createMainPlayerSyncSystem();
      this.colliderSystem = createColliderSystem(this);
      this.resourceSystem = createResourceSystem();
      this.buildingPlacementSystem = createBuildingPlacementSystem(this);
      this.buildingSystem = createBuildingSystem();
      this.tagSystem = createTagSystem(this);
      this.playerSystem = createPlayerSystem(mainPlayerId);

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
      !this.mainPlayerSyncSystem ||
      !this.resourceSystem ||
      !this.buildingPlacementSystem ||
      !this.buildingSystem ||
      !this.playerSystem ||
      !this.tagSystem
    )
      return;

    let newState = { ...this.state, dt: dt };
    const [packets, length] = Game.network.getReceivedPackets();
    receiveServerEntities(this.world, packets);

    newState = this.spriteRegisterySystem(newState);
    newState = this.colliderSystem(newState);
    newState = this.spriteSystem(newState);

    newState = this.playerSystem([this.world, newState])[1];
    newState = this.mainPlayerSystem([this.world, newState])[1];
    newState = this.mainPlayerSyncSystem([this.world, newState])[1];

    newState = this.resourceSystem([this.world, newState])[1];
    newState = this.buildingSystem(newState);

    newState = this.buildingPlacementSystem(newState);
    newState = this.tagSystem([this.world, newState])[1];

    // Update state
    this.state = newState;

    Game.network.readReceivedPackets(length);
  }

  static destroy() {
    if (Game.network) Game.network.disconnect();
    events.unsubscribe('joinWorld', () => {});
    events.unsubscribe('networkLoadWorld', () => {});
  }
}

const receiveServerEntities = (world: IWorld, packets: ServerPacket<unknown>[]) => {
  const worldDeserializer = defineDeserializer(world); // TODO: move this to a more global scope

  for (let i = 0; i < packets.length; i++) {
    const packet = packets[i];
    if (packet.packet_type === PacketType.SYNC_SERVER_ENTITY) {
      const { buffer: jsonBuffer, serializationId } = packet.data as SyncServerEntityPacket;
      const buffer = Buffer.from(jsonBuffer);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

      if (serializationId === SerializationID.WORLD) {
        const ents = worldDeserializer(world, arrayBuffer);
        console.log(`Received ${ents.length} entities from server when syncing world.`);
        return;
      }

      const deserialize = defineDeserializer(serializeConfig[serializationId]);

      const deserializedEnts = deserialize(world, arrayBuffer);
      console.log(`Received ${deserializedEnts} entities from server. (${serializationId})`);
      if (serializationId === SerializationID.PLAYER_FULL_SERVER) {
        deserializedEnts.forEach((ent) => {
          console.log(`Player entity ${Player.userId[ent]} received from server`);
        });
      }
    }
    // if (packet.packet_type === PacketType.DISCONNECT) {
    //   const data = packet.data as DisconnectPacketData;
    //   console.log(`Received disconnect packet for entity ${data.eid}`);
    //   removePlayerEntity(world, data.eid);
    // }
  }
};
