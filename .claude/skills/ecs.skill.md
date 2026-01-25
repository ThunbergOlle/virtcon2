# ECS Skill

Use this skill when working with the Entity Component System (ECS), including:
- Finding or modifying components, systems, or worlds
- Understanding ECS architecture and data flow
- Debugging ECS-related issues
- Adding new components or systems
- Working with entity serialization and network synchronization

## Overview

This project uses **bytenetc**, a custom sparse-set ECS framework with typed array storage. Both server (packet_router) and client (game) maintain parallel ECS instances synchronized via Socket.io packets.

## Key Locations

**ECS Core Framework:**
- `packages/bytenetc/src/lib/` - Core ECS implementation

**Components:**
- `packages/network-world-entities/src/lib/components/` - All component definitions
- Common components: Position, Sprite, Velocity, Collider, Player, Building, Resource, Tile

**Systems:**
- `apps/packet_router/src/systems/` - Server-side systems (20 TPS tick loop)
- `apps/game/src/systems/` - Client-side systems (60 FPS render loop)

**Entities:**
- `packages/network-world-entities/src/lib/entities/` - Entity factory functions

**Serialization:**
- `packages/network-world-entities/src/lib/serializeConfig.ts` - Component serialization config
- `packages/network-world-entities/src/lib/SerializationIDs.ts` - Serialization ID definitions

**Network Sync:**
- `apps/packet_router/src/main.ts` - Server tick loop and packet broadcasting
- `apps/game/src/scenes/Game.ts` - Client packet handling and deserialization
- `apps/game/src/networking/Network.ts` - Socket.io client wrapper

## Quick Reference

### Component Definition

```typescript
import { defineComponent, Types } from '@virtcon2/bytenetc';

export const MyComponent = defineComponent('myComponent', {
  value: Types.i32,
  position: Types.f32,
  data: [Types.ui8, 32], // Fixed-size array
});
```

**Supported types:** `i8`, `i16`, `i32`, `f32`, `f64`, `ui8`, `ui16`, `ui32`

### World Management

```typescript
import { createWorld, deleteWorld, registerComponents } from '@virtcon2/bytenetc';

const world = createWorld('world-id');
registerComponents(world, [Position, Sprite, MyComponent]);
deleteWorld(world); // Cleanup
```

### Entity Operations

```typescript
import { addEntity, addComponent, removeEntity, removeComponent } from '@virtcon2/bytenetc';

const eid = addEntity(world);
addComponent(world, Position, eid);

// Set values (direct array access)
Position.x[eid] = 100;
Position.y[eid] = 200;

removeComponent(world, Sprite, eid);
removeEntity(world, eid);
```

### Queries

```typescript
import { defineQuery, Has, Not, Changed, enterQuery, exitQuery } from '@virtcon2/bytenetc';

// Basic query - entities with both components
const query = defineQuery(Position, Sprite);
const entities = query(world); // Returns entity ID array

// Modifiers
const playerQuery = defineQuery(Position, Has(Player), Not(NPC));
const changedQuery = defineQuery(Changed(Position));

// Enter/Exit queries
const newEntities = enterQuery(query)(world);
const removedEntities = exitQuery(query)(world);
```

### System Definition (Server)

```typescript
import { defineSystem } from '@virtcon2/bytenetc';
import type { SyncEntities } from '@virtcon2/network-packet';

export const createMySystem = (world: World) => {
  const query = defineQuery(Position, MyComponent);

  return defineSystem<SyncEntities>(({ worldData }) => {
    const entitiesToSync: number[] = [];
    const entitiesToRemove: number[] = [];

    // Process entities
    for (const eid of query(world)) {
      Position.x[eid] += 1;
      entitiesToSync.push(eid);
    }

    // Serialize for network
    const serialized = defineSerializer(
      getSerializeConfig(world)[SerializationID.MY_ENTITY]
    )(world, entitiesToSync);

    return {
      sync: [{ serializationId: SerializationID.MY_ENTITY, data: serialized }],
      removeEntities: entitiesToRemove,
      worldData,
    };
  });
};
```

### System Definition (Client)

```typescript
export const createMyClientSystem = (world: World) => {
  const query = defineQuery(Position, Sprite);

  return (state: State) => {
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

## Network Synchronization Flow

1. **Server (packet_router):**
   - Runs tick loop at 20 TPS (`apps/packet_router/src/main.ts`)
   - Systems process entities and return serialized data
   - Broadcasts `SYNC_SERVER_ENTITY` and `REMOVE_ENTITY` packets via Socket.io

2. **Client (game):**
   - Receives packets in `Game.update()` (`apps/game/src/scenes/Game.ts`)
   - Deserializes entities into local ECS world
   - Runs client systems at 60 FPS to update Phaser sprites

3. **Serialization:**
   - Defined in `serializeConfig.ts` - maps SerializationID to component lists
   - Entities serialize to arrays: `[componentName, fieldName, value]`
   - Only specified components are synced per entity type

## Common Tasks

### Adding a New Component

1. Create component definition in `packages/network-world-entities/src/lib/components/`
2. Export from `packages/network-world-entities/src/lib/components/index.ts`
3. Add to serialization config in `serializeConfig.ts` if network-synced
4. Register in world initialization (both server and client if synced)

### Adding a New System

**Server:**
1. Create in `apps/packet_router/src/systems/`
2. Import and add to `tickSystems()` in `apps/packet_router/src/main.ts`

**Client:**
1. Create in `apps/game/src/systems/`
2. Import and call in `Game.update()` in `apps/game/src/scenes/Game.ts`

### Adding a New Entity Type

1. Create factory function in `packages/network-world-entities/src/lib/entities/`
2. Add SerializationID in `SerializationIDs.ts`
3. Add serialization config in `serializeConfig.ts`
4. Create spawning logic in appropriate system

## Debugging

**Check which entities have a component:**
```typescript
const query = defineQuery(MyComponent);
console.log('Entities with MyComponent:', query(world));
```

**Check component values:**
```typescript
console.log('Position:', { x: Position.x[eid], y: Position.y[eid] });
```

**Track component changes:**
```typescript
const changedQuery = defineQuery(Changed(Position));
console.log('Entities with changed Position:', changedQuery(world));
```

## Important Notes

- Maximum 3,000 entities per world
- Component data stored in typed arrays for performance
- Direct array access (e.g., `Position.x[eid]`) for reading/writing values
- Server systems run at 20 TPS, client systems at 60 FPS
- Not all components need network sync (client-only rendering components)
- Use enter/exit queries to detect new/removed entities efficiently

## Documentation

Full details: `/docs/ECS_AND_NETWORK_SYNC.md`
