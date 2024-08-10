import { Scene, Tilemaps } from 'phaser';
import { SceneStates } from './interfaces';

import { RedisWorldResource, worldMapParser } from '@shared';
import { DBBuilding } from '@virtcon2/static-game-data';
import { events } from '../events/Events';

import { createWorld, debugEntity, defineDeserializer, deserializeEntity, registerComponents, removeEntity, System, World } from '@virtcon2/bytenetc';
import { DisconnectPacketData, PacketType, ServerPacket, SyncServerEntityPacket } from '@virtcon2/network-packet';
import { allComponents, Player, SerializationID, serializeConfig } from '@virtcon2/network-world-entities';
import { Network } from '../networking/Network';
import { createBuildingPlacementSystem } from '../systems/BuildingPlacementSystem';
import { createBuildingSystem } from '../systems/BuildingSystem';
import { createColliderSystem } from '../systems/ColliderSystem';
import { createMainPlayerSyncSystem } from '../systems/MainPlayerSyncSystem';
import { createMainPlayerSystem } from '../systems/MainPlayerSystem';
import { createPlayerSystem } from '../systems/PlayerSystem';
import { createResourceSystem } from '../systems/ResourceSystem';
import { createSpriteRegisterySystem, createMovingSpriteSystem } from '../systems/SpriteSystem';
import { createTagSystem } from '../systems/TagSystem';

export enum GameObjectGroups {
  PLAYER = 0,
  BUILDING = 1,
  RESOURCE = 2,
  TERRAIN = 3,
  BUILDING_NO_COLLIDE = 4,
}
export interface GameState {
  dt: number;
  world: World;
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
  private map!: Tilemaps.Tilemap;
  private isInitialized = false;

  public state: GameState = {
    dt: 0,
    world: '',
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
  public mainPlayerSystem?: System<GameState>;
  public mainPlayerSyncSystem?: System<GameState>;
  public colliderSystem?: System<GameState>;
  public resourceSystem?: System<GameState>;
  public buildingPlacementSystem?: System<GameState>;
  public buildingSystem?: System<GameState>;
  public tagSystem?: System<GameState>;
  public playerSystem?: System<GameState>;

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

    this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], this.state.gameObjectGroups[GameObjectGroups.BUILDING] ?? []);
    // this is commented out since we don't want to collide with resources. This may change in the future.
    // this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], this.state.gameObjectGroups[GameObjectGroups.RESOURCE] ?? []);
    this.physics.add.collider(this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [], this.state.gameObjectGroups[GameObjectGroups.TERRAIN] ?? []);

    events.subscribe('joinWorld', (worldId) => {
      this.physics.world.createDebugGraphic();
      Game.network.join(worldId);
    });

    events.subscribe('networkLoadWorld', ({ heightMap, id, mainPlayerId }) => {
      Game.network.readReceivedPacketType(PacketType.LOAD_WORLD);
      this.state.world = createWorld(id);

      registerComponents(this.state.world, allComponents);
      console.log('Loading world data...');

      this.spriteRegisterySystem = createSpriteRegisterySystem(this.state.world, this);
      this.spriteSystem = createMovingSpriteSystem(this.state.world);
      this.mainPlayerSystem = createMainPlayerSystem(this.state.world, this, this.input.keyboard.createCursorKeys());
      // this.playerReceiveNetworkSystem = createPlayerReceiveNetworkSystem(); - replaced by networked entities
      this.mainPlayerSyncSystem = createMainPlayerSyncSystem(this.state.world);
      this.colliderSystem = createColliderSystem(this.state.world, this);
      this.resourceSystem = createResourceSystem(this.state.world);
      this.buildingPlacementSystem = createBuildingPlacementSystem(this.state.world, this);
      this.buildingSystem = createBuildingSystem(this.state.world);
      this.tagSystem = createTagSystem(this.state.world, this);
      this.playerSystem = createPlayerSystem(this.state.world, mainPlayerId);

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

      this.isInitialized = true;
    });
  }

  preload() {}
  update(t: number, dt: number) {
    if (
      !this.spriteSystem ||
      !this.mainPlayerSystem ||
      !this.colliderSystem ||
      !this.spriteRegisterySystem ||
      !this.mainPlayerSyncSystem ||
      !this.resourceSystem ||
      !this.buildingPlacementSystem ||
      !this.buildingSystem ||
      !this.playerSystem ||
      !this.tagSystem ||
      !this.isInitialized
    )
      return;

    let newState = { ...this.state, dt: dt };
    const [packets, length] = Game.network.getReceivedPackets();
    receiveServerPackets(this.state.world, packets);

    newState = this.spriteRegisterySystem(newState);
    newState = this.colliderSystem(newState);
    newState = this.spriteSystem(newState);

    newState = this.playerSystem(newState);
    newState = this.mainPlayerSystem(newState);
    newState = this.mainPlayerSyncSystem(newState);

    newState = this.resourceSystem(newState);
    newState = this.buildingSystem(newState);

    newState = this.buildingPlacementSystem(newState);
    newState = this.tagSystem(newState);

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

const receiveServerPackets = (world: World, packets: ServerPacket<unknown>[]) => {
  for (let i = 0; i < packets.length; i++) {
    const packet = packets[i];
    switch (packet.packet_type) {
      case PacketType.SYNC_SERVER_ENTITY:
        handleSyncServerEntityPacket(world, packet as ServerPacket<SyncServerEntityPacket>);
        break;
      case PacketType.DISCONNECT:
        handleDisconnectPacket(world, packet as ServerPacket<DisconnectPacketData>);
        break;
    }
  }
};

const handleSyncServerEntityPacket = (world: World, packet: ServerPacket<SyncServerEntityPacket>) => {
  const { data, serializationId } = packet.data;

  if (serializationId === SerializationID.WORLD) {
    for (let i = 0; i < data.length; i++) {
      deserializeEntity(world, data[i]);
    }
  } else {
    const deserialize = defineDeserializer(serializeConfig[serializationId]);
    const entityId = deserialize(world, data);
  }
};

const handleDisconnectPacket = (world: World, packet: ServerPacket<DisconnectPacketData>) => {
  removeEntity(world, packet.data.eid);
};
