import { Scene } from 'phaser';
import { SceneStates } from './interfaces';

import { DBBuilding } from '@virtcon2/static-game-data';
import { events } from '../events/Events';

import {
  createWorld,
  debugEntity,
  defineDeserializer,
  deserializeEntity,
  doesEntityExist,
  registerComponents,
  removeEntity,
  System,
  World,
} from '@virtcon2/bytenetc';
import { DisconnectPacketData, PacketType, RemoveEntityPacket, ServerPacket, SyncServerEntityPacket } from '@virtcon2/network-packet';
import { allComponents, GameObjectGroups, SerializationID, getSerializeConfig } from '@virtcon2/network-world-entities';
import { Network } from '../networking/Network';
import { createBuildingPlacementSystem } from '../systems/BuildingPlacementSystem';
import { createBuildingSystem } from '../systems/BuildingSystem';
import { createColliderSystem } from '../systems/ColliderSystem';
import { createMainPlayerSyncSystem } from '../systems/MainPlayerSyncSystem';
import { createMainPlayerSystem } from '../systems/MainPlayerSystem';
import { createPlayerSystem } from '../systems/PlayerSystem';
import { createResourceSystem } from '../systems/ResourceSystem';
import { createMovingSpriteSystem, createSpriteRegisterySystem } from '../systems/SpriteSystem';
import { createTagSystem } from '../systems/TagSystem';
import { createConnectionSystem } from '../systems/ConnectionSystem';
import { createItemSystem } from '../systems/ItemSystem';
import { createWorldBorderSystem } from '../systems/WorldBorderSystem';
import { createDebugPositionSystem } from '../systems/EntitiyDebugSystem';
import { makeVar } from '@apollo/client';

export const isPreloaded = makeVar(false);

export interface GameState {
  dt: number;
  world: World;
  spritesById: { [key: number]: Phaser.GameObjects.Sprite };
  playerById: { [key: number]: string };
  tagGameObjectById: { [key: number]: Phaser.GameObjects.Text };
  ghostBuildingById: { [key: number]: DBBuilding };
  worldConnectionPointById: {
    [key: number]: { startPoint: Phaser.GameObjects.Arc; endPoint: Phaser.GameObjects.Arc; line: Phaser.GameObjects.Line };
  };

  gameObjectGroups: {
    [key in GameObjectGroups]: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup | null;
  };
}

export default class Game extends Scene implements SceneStates {
  private isInitialized = false;
  public debugMode = false;

  public state: GameState = {
    dt: 0,
    world: '',
    spritesById: {},
    playerById: {},
    ghostBuildingById: {},
    tagGameObjectById: {},
    worldConnectionPointById: {},
    gameObjectGroups: {
      [GameObjectGroups.PLAYER]: null,
      [GameObjectGroups.BUILDING]: null,
      [GameObjectGroups.RESOURCE]: null,
      [GameObjectGroups.TERRAIN]: null,
      [GameObjectGroups.BUILDING_NO_COLLIDE]: null,
      [GameObjectGroups.ITEM]: null,
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
  public connectionSystem?: System<GameState>;
  public itemSystem?: System<GameState>;
  public worldBorderSystem?: System<GameState>;
  public debugPositionSystem?: System<GameState>;

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
    return this;
  }

  disableKeys() {
    if (this.input.keyboard) this.input.keyboard.enabled = false;
  }

  enableKeys() {
    if (this.input.keyboard) this.input.keyboard.enabled = true;
  }

  create() {
    Game.network = new Network();

    class OutlinePipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
      constructor(game: Phaser.Game) {
        super({
          game: game,
          fragShader: game.cache.shader.get('outlineShader').fragmentSrc,
          uniforms: [
            'uProjectionMatrix', // Default uniform
            'uMainSampler', // Default texture sampler
            'uTextureSize', // Custom uniform for sprite size
            'uOutlineColor', // Custom uniform for outline color
            'uOutlineThickness', // Custom uniform for outline thickness
          ],
        });
      }

      onBind(gameObject: Phaser.GameObjects.Sprite) {
        const width = gameObject.width;
        const height = gameObject.height;

        this.set2f('uTextureSize', width, height); // Set uTextureSize (vec2)
        super.onBind(gameObject);
      }
    }

    const outlinePipeline = (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.add('outline', new OutlinePipeline(this.game));

    outlinePipeline.set4f('uOutlineColor', 1.0, 1.0, 1.0, 1.0); // White outline (RGBA)

    this.state.gameObjectGroups = {
      [GameObjectGroups.PLAYER]: this.physics.add.group(),
      [GameObjectGroups.BUILDING]: this.physics.add.staticGroup(),
      [GameObjectGroups.RESOURCE]: this.physics.add.staticGroup(),
      [GameObjectGroups.TERRAIN]: this.physics.add.staticGroup(),
      [GameObjectGroups.BUILDING_NO_COLLIDE]: this.physics.add.staticGroup(),
      [GameObjectGroups.ITEM]: this.physics.add.staticGroup(),
      [GameObjectGroups.BORDER]: this.physics.add.staticGroup(),
    };

    this.physics.add.collider(
      this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [],
      this.state.gameObjectGroups[GameObjectGroups.BUILDING] ?? [],
    );

    this.physics.add.collider(
      this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [],
      this.state.gameObjectGroups[GameObjectGroups.RESOURCE] ?? [],
    );

    this.physics.add.collider(
      this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [],
      this.state.gameObjectGroups[GameObjectGroups.TERRAIN] ?? [],
    );

    this.physics.add.collider(
      this.state.gameObjectGroups[GameObjectGroups.PLAYER] ?? [],
      this.state.gameObjectGroups[GameObjectGroups.BORDER] ?? [],
    );

    events.subscribe('joinWorld', (worldId) => {
      if (this.debugMode) this.physics.world.createDebugGraphic();
      Game.network.join(worldId);
    });

    events.subscribe('networkLoadWorld', ({ id, mainPlayerId }) => {
      Game.network.readReceivedPacketType(PacketType.LOAD_WORLD);
      this.state.world = createWorld(id);

      window.debugEntity = (entityId) => console.log(debugEntity(this.state.world, entityId));

      registerComponents(this.state.world, allComponents);
      console.log('Loading world data...');

      this.spriteRegisterySystem = createSpriteRegisterySystem(this.state.world, this);
      this.spriteSystem = createMovingSpriteSystem(this.state.world);
      this.mainPlayerSystem = createMainPlayerSystem(this.state.world, this, this.input.keyboard!.createCursorKeys());
      this.mainPlayerSyncSystem = createMainPlayerSyncSystem(this.state.world);
      this.colliderSystem = createColliderSystem(this.state.world, this);
      this.resourceSystem = createResourceSystem(this.state.world);
      this.buildingPlacementSystem = createBuildingPlacementSystem(this.state.world, this);
      this.buildingSystem = createBuildingSystem(this.state.world);
      this.tagSystem = createTagSystem(this.state.world, this);
      this.playerSystem = createPlayerSystem(this.state.world, mainPlayerId, this);
      this.connectionSystem = createConnectionSystem(this.state.world, this);
      this.itemSystem = createItemSystem(this.state.world, this);
      this.worldBorderSystem = createWorldBorderSystem(this.state.world, this);

      if (this.debugMode) this.debugPositionSystem = createDebugPositionSystem(this.state.world, this);

      this.isInitialized = true;
    });
  }

  preload() {
    isPreloaded(true);
  }
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
      !this.itemSystem ||
      !this.connectionSystem ||
      !this.worldBorderSystem ||
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

    newState = this.connectionSystem(newState);
    newState = this.itemSystem(newState);

    newState = this.worldBorderSystem(newState);

    if (this.debugPositionSystem) {
      newState = this.debugPositionSystem(newState);
    }

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
      case PacketType.REMOVE_ENTITY:
        (packet as ServerPacket<RemoveEntityPacket>).data.entityIds.forEach((eid) => {
          removeEntity(world, eid);
        });
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
      const eid = data[i][0][2];
      const conflict = doesEntityExist(world, eid as number);

      if (conflict) console.error(`Conflict, entity with id ${eid} already exists`);
      deserializeEntity(world, data[i]);
    }
  } else {
    const deserialize = defineDeserializer(getSerializeConfig(world)[serializationId]);
    deserialize(world, data);
  }
};

const handleDisconnectPacket = (world: World, packet: ServerPacket<DisconnectPacketData>) => {
  removeEntity(world, packet.data.eid);
};
