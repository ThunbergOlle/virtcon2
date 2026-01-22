# ECS System and Network Entity Synchronization

This document explains how the bytenetc Entity Component System works and how entities are synchronized between server and client.

## ECS Framework (bytenetc)

### Core Concepts

The bytenetc ECS is a **sparse-set based system** using **typed arrays** for efficient memory management and serialization.

- **Entity**: A simple `number` (entity ID). Maximum 3,000 entities per world.
- **Component**: Defined with `defineComponent(name, schema)`, stores data in typed arrays.
- **World**: A string identifier managing entities, components, queries, and state.
- **System**: A function that processes entities matching specific component patterns.

### Defining Components

Components use typed array storage for performance:

```typescript
import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Position = defineComponent('position', {
  x: Types.f32,
  y: Types.f32,
});

export const Resource = defineComponent('resource', {
  health: Types.i32,
  itemId: Types.ui16,
  worldBuildingId: Types.ui16,
});

// Arrays supported: [Type, length]
export const Tag = defineComponent('tag', {
  value: [Types.ui8, 32],  // 32-byte UTF8 string
});
```

Supported types: `i8`, `i16`, `i32`, `f32`, `f64`, `ui8`, `ui16`, `ui32`

### World Management

```typescript
import { createWorld, deleteWorld, registerComponents } from '@virtcon2/bytenetc';

// Create world and register components
const world = createWorld('world-123');
registerComponents(world, [Position, Sprite, Player, Building]);

// Cleanup
deleteWorld(world);
```

### Entity Operations

```typescript
import { addEntity, addComponent, removeEntity, removeComponent } from '@virtcon2/bytenetc';

// Create entity
const eid = addEntity(world);

// Add components
addComponent(world, Position, eid);
addComponent(world, Sprite, eid);

// Set component values (direct array access)
Position.x[eid] = 100;
Position.y[eid] = 200;

// Remove
removeComponent(world, Sprite, eid);
removeEntity(world, eid);
```

### Queries

Queries find entities matching component patterns:

```typescript
import { defineQuery, Has, Not, Changed, enterQuery, exitQuery } from '@virtcon2/bytenetc';

// Basic query - entities with both Position AND Sprite
const movingQuery = defineQuery(Position, Sprite);
const entities = movingQuery(world);  // Returns entity ID array

// Modifiers
const playerQuery = defineQuery(Position, Has(Player), Not(NPC));
const changedQuery = defineQuery(Changed(Position));  // Tracks changes

// Enter/Exit queries - detect when entities match/unmatch
const newEntities = enterQuery(movingQuery)(world);
const removedEntities = exitQuery(movingQuery)(world);
```

Query modifiers:
- `Has(component)` - Entity must have component
- `Not(component)` - Entity must NOT have component
- `Changed(component)` - Component data changed since last query

## Network Synchronization

### Architecture Overview

```
┌─────────────────┐                    ┌─────────────────┐
│  Packet Router  │                    │   Game Client   │
│   (Server ECS)  │                    │  (Client ECS)   │
├─────────────────┤                    ├─────────────────┤
│                 │  SYNC_SERVER_ENTITY│                 │
│  Tick Loop      │ ──────────────────>│  Update Loop    │
│  (20 TPS)       │                    │  (60 FPS)       │
│                 │  SYNC_CLIENT_ENTITY│                 │
│  Systems run    │ <──────────────────│  Systems run    │
│                 │                    │                 │
│  Serialize      │    REMOVE_ENTITY   │  Deserialize    │
│  entities       │ ──────────────────>│  entities       │
└─────────────────┘                    └─────────────────┘
```

### Packet Types

```typescript
enum PacketType {
  SYNC_SERVER_ENTITY = 'syncServerEntity',  // Server → Client
  SYNC_CLIENT_ENTITY = 'syncClientEntity',  // Client → Server
  REMOVE_ENTITY = 'removeEntity',           // Entity deletion
}
```

### Serialization IDs

Different entity types serialize different component sets:

```typescript
enum SerializationID {
  PLAYER_MOVEMENT = 'player-movement',       // Position, Velocity, Player
  PLAYER_FULL_SERVER = 'player-full-server', // All player components
  BUILDING_FULL_SERVER = 'building-full-server',
  TILE = 'tile',
  RESOURCE = 'resource',
  ITEM = 'item',
  WORLD_BORDER = 'world-border',
}
```

Configuration in `packages/network-world-entities/src/lib/serializeConfig.ts`:

```typescript
export const getSerializeConfig = (world: World) => ({
  [SerializationID.TILE]: [Position, Sprite, Tile],
  [SerializationID.RESOURCE]: [Position, Sprite, Collider, Resource],
  [SerializationID.PLAYER_MOVEMENT]: [Position, Velocity, Player],
  // ...
});
```

### Serialization Format

Entities serialize to arrays of component field values:

```typescript
// SerializedData format
type SerializedData = [string, string, number | TypedArray][];

// Example serialized entity:
[
  ['_entity', '_entity', 1000],      // Entity ID
  ['position', 'x', 128.5],
  ['position', 'y', 256.0],
  ['sprite', 'texture', 3],
  ['sprite', 'variant', 0],
]
```

### Server-Side: Tick Loop

Located in `apps/packet_router/src/main.ts`:

```typescript
const TPS = 20;  // Ticks per second

setInterval(() => {
  const packets: ServerPacket[] = [];

  for (const world of worlds) {
    // Run all systems
    const systemsOutput = tickSystems(world);

    // Collect sync packets
    for (const { sync, removeEntities } of systemsOutput) {
      if (removeEntities.length) {
        packets.push({
          packet_type: PacketType.REMOVE_ENTITY,
          target: world,
          data: { entityIds: removeEntities },
        });
      }

      for (const { serializationId, data } of sync) {
        packets.push({
          packet_type: PacketType.SYNC_SERVER_ENTITY,
          target: world,
          data: { serializationId, data },
        });
      }
    }
  }

  // Broadcast to clients by world
  for (const [target, worldPackets] of Object.entries(groupBy(p => p.target)(packets))) {
    io.sockets.to(target).emit('packets', worldPackets);
  }
}, 1000 / TPS);
```

### Server-Side: System Example

```typescript
export const createTileSystem = (world: World, seed: number) => {
  const tileQuery = defineQuery(Tile, Position);
  const playerQuery = defineQuery(Player, Position);

  return defineSystem<SyncEntities>(({ worldData }) => {
    const newEntities: number[] = [];
    const removedEntities: number[] = [];

    // Generate tiles within render distance of players
    for (const playerEid of playerQuery(world)) {
      const px = Position.x[playerEid];
      const py = Position.y[playerEid];

      const tilesInRange = generateTilesInArea(px, py, RENDER_DISTANCE, seed);
      newEntities.push(...tilesInRange);
    }

    // Remove tiles outside render distance
    for (const tileEid of tileQuery(world)) {
      if (!isWithinRenderDistance(world, playerQuery(world), tileEid)) {
        removedEntities.push(tileEid);
        removeEntity(world, tileEid);
      }
    }

    // Serialize new entities
    const serialized = defineSerializer(
      getSerializeConfig(world)[SerializationID.TILE]
    )(world, newEntities);

    return {
      sync: [{ serializationId: SerializationID.TILE, data: serialized }],
      removeEntities: removedEntities,
      worldData,
    };
  });
};
```

### Client-Side: Receiving Packets

In `apps/game/src/scenes/Game.ts`:

```typescript
update(t, dt) {
  // 1. Get queued packets from network
  const [packets, length] = Game.network.getReceivedPackets();

  // 2. Process each packet
  for (const packet of packets) {
    switch (packet.packet_type) {
      case PacketType.SYNC_SERVER_ENTITY:
        handleSyncPacket(world, packet);
        break;
      case PacketType.REMOVE_ENTITY:
        packet.data.entityIds.forEach(eid => removeEntity(world, eid));
        break;
    }
  }

  // 3. Run client systems
  state = spriteRegistrySystem(state);
  state = colliderSystem(state);
  state = spriteSystem(state);
  // ...

  // 4. Mark packets as consumed
  Game.network.readReceivedPackets(length);
}

const handleSyncPacket = (world, packet) => {
  const { serializationId, data } = packet.data;
  const deserialize = defineDeserializer(
    getSerializeConfig(world)[serializationId]
  );
  deserialize(world, data);  // Creates/updates ECS entities
};
```

### Client-Side: ECS to Phaser Mapping

The client maintains a mapping between ECS entities and Phaser game objects:

```typescript
// state.spritesById[entityId] = Phaser.GameObjects.Sprite

// SpriteRegistry system creates sprites for new entities
const createSpriteRegistrySystem = (world, scene) => {
  const spriteQuery = defineQuery(Sprite, Position);
  const enterSpriteQuery = enterQuery(spriteQuery);
  const exitSpriteQuery = exitQuery(spriteQuery);

  return (state) => {
    // Create sprites for new entities
    for (const eid of enterSpriteQuery(world)) {
      const sprite = scene.add.sprite(
        Position.x[eid],
        Position.y[eid],
        getTextureName(Sprite.texture[eid])
      );
      state.spritesById[eid] = sprite;
    }

    // Destroy sprites for removed entities
    for (const eid of exitSpriteQuery(world)) {
      state.spritesById[eid]?.destroy();
      delete state.spritesById[eid];
    }

    return state;
  };
};

// Sprite movement system updates positions each frame
const createMovingSpriteSystem = (world) => {
  const query = defineQuery(Sprite, Position);

  return (state) => {
    for (const eid of query(world)) {
      const sprite = state.spritesById[eid];
      if (sprite) {
        sprite.x = Position.x[eid];
        sprite.y = Position.y[eid];
      }
    }
    return state;
  };
};
```

## Entity Types and Components

### Player

```typescript
// Components: Position, Sprite, Player, Collider, Tag, Velocity
Position: { x: f32, y: f32 }
Sprite: { texture: ui16, variant: ui8, depth: i16, dynamicBody: ui8, rotation: ui8 }
Player: { oderId: ui32, oderId: ui32, facing: ui8 }
Collider: { sizeWidth: ui16, sizeHeight: ui16, offsetX: i16, offsetY: i16, static: ui8, group: ui8 }
Tag: { value: [ui8, 32] }  // Player name
Velocity: { x: f32, y: f32 }
```

### Building

```typescript
// Components: Building, Sprite, Collider, Position
Building: { worldBuildingId: ui32 }
Sprite: { texture: ui16, variant: ui8, rotation: ui8 }
Collider: { sizeWidth: ui16, sizeHeight: ui16, offsetX: i16, offsetY: i16, static: ui8, group: ui8 }
Position: { x: f32, y: f32 }
```

### Tile

```typescript
// Components: Position, Sprite, Tile
Position: { x: f32, y: f32 }
Sprite: { texture: ui16, variant: ui8, depth: i16, rotation: ui8, opacity: ui8 }
Tile: { height: ui8, type: [ui8, 16] }
```

### Resource

```typescript
// Components: Position, Sprite, Collider, Resource
Position: { x: f32, y: f32 }
Sprite: { texture: ui16, variant: ui8, opacity: ui8 }
Collider: { sizeWidth: ui16, sizeHeight: ui16, offsetX: i16, offsetY: i16, static: ui8, group: ui8 }
Resource: { health: i32, itemId: ui16, worldBuildingId: ui16 }
```

## Key Files

| Purpose | Location |
|---------|----------|
| ECS Core | `packages/bytenetc/src/lib/entity.ts` |
| Components | `packages/network-world-entities/src/lib/components/` |
| Entities | `packages/network-world-entities/src/lib/entities/` |
| Serialization Config | `packages/network-world-entities/src/lib/serializeConfig.ts` |
| Packet Types | `packages/network-packet/src/lib/types/` |
| Server Tick Loop | `apps/packet_router/src/main.ts` |
| Server Systems | `apps/packet_router/src/systems/` |
| Client Game Scene | `apps/game/src/scenes/Game.ts` |
| Client Systems | `apps/game/src/systems/` |
| Client Networking | `apps/game/src/networking/Network.ts` |
