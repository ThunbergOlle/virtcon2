---
name: new-harvestable
description: Step-by-step guide for adding a new harvestable type to the game (trees, bushes, crops, etc.). Use when adding plantable/harvestable entities.
---

# Adding a New Harvestable

This guide walks through all the steps required to add a new harvestable type to the game.

## Overview

A harvestable is a world entity that players can place (via saplings/seeds) and harvest using tools. Examples include trees (wood), berry bushes, etc.

## Prerequisites

- Sprite assets for the harvestable (fully grown + any growth stages)
- Knowledge of what item the harvestable drops when harvested
- Knowledge of what item is used to plant it (sapling/seed)

---

## Step-by-Step Guide

### Step 1: Add Harvestable Name to Enum

**File:** `packages/static-game-data/src/lib/harvestable_type.ts`

Add your new harvestable name to the `HarvestableNames` enum:

```typescript
export enum HarvestableNames {
  WOOD = 'WOOD',
  BERRY_BUSH = 'BERRY_BUSH',  // Add your new harvestable
}
```

### Step 2: Define Harvestable Type Data

**File:** `packages/static-game-data/src/lib/harvestable_type.ts`

Add your harvestable configuration to the `Harvestable` object:

```typescript
export const Harvestable: Record<HarvestableNames, HarvestableType> = {
  // ... existing harvestables
  [HarvestableNames.BERRY_BUSH]: {
    name: HarvestableNames.BERRY_BUSH,
    sprite: 'harvestable_berry_bush',        // Main sprite name
    item: 14,                                 // Item ID dropped when harvested
    full_health: 3,                           // Hits required to harvest
    defaultDropCount: 2,                      // Number of items dropped
    width: 1,                                 // Width in tiles
    height: 1,                                // Height in tiles
    spriteWidth: 32,                          // Sprite width in pixels
    spriteHeight: 32,                         // Sprite height in pixels
    layer: 'ground',                          // 'ground' or 'underground'
    states: [                                 // Growth stages (optional)
      {
        maxAge: 100,                          // Age threshold for this state
        sprite: 'harvestable_berry_bush_small',
      },
    ],
    spawnSettings: {                          // Natural spawn settings (optional)
      minHeight: 0.3,
      maxHeight: 0.7,
      chance: 0.005,                          // 0.5% spawn chance
    },
  },
};
```

**Key Properties:**
- `states`: Array of growth stages. Harvestable uses state sprite until age exceeds `maxAge`, then uses main sprite.
- `spawnSettings`: If provided, harvestable can spawn naturally during world generation.
- `layer`: Determines collision layer and rendering order.

### Step 3: Add Sprite Assets

**Location:** `apps/game/public/assets/sprites/harvestables/`

Add your sprite files:
- `harvestable_berry_bush.png` - Main (fully grown) sprite
- `harvestable_berry_bush_small.png` - Growth stage sprite(s)

**Naming Convention:** `harvestable_<name>.png` and `harvestable_<name>_<stage>.png`

### Step 4: Register Sprites in Texture Map

**File:** `packages/network-world-entities/src/lib/SpriteMap.ts`

Add entries to both texture maps:

```typescript
// Main harvestable texture
export const HarvestableTextureMap: Record<HarvestableNames, { textureId: number; width: number; height: number }> = {
  // ... existing
  [HarvestableNames.BERRY_BUSH]: { textureId: 303, width: 32, height: 32 },
};

// Growth stage textures
export const HarvestableStageTextureMap: Record<string, { textureId: number; width: number; height: number }> = {
  // ... existing
  harvestable_berry_bush_small: { textureId: 304, width: 32, height: 32 },
};
```

**Important:** Choose unique `textureId` values that don't conflict with existing textures.

### Step 5: Create the Sapling/Seed Item

**File:** `packages/static-game-data/src/lib/items/db/item_<sapling_name>.ts`

Create a new item file for the planting item:

```typescript
import { DBItem, ItemCategory } from '../item_type';
import { Harvestable, HarvestableNames } from '../../harvestable_type';

export const item_berry_seed: DBItem = {
  id: 15,                                    // Unique item ID
  name: 'Berry Seed',
  display_name: 'Berry Seed',
  category: ItemCategory.RESOURCE,
  stack_size: 99,
  sprite: 'item_berry_seed',
  harvestable: Harvestable[HarvestableNames.BERRY_BUSH],  // Links to harvestable
};
```

**Important:** The `harvestable` property is what enables the item to be planted.

### Step 6: Create the Drop Item (if different from sapling)

**File:** `packages/static-game-data/src/lib/items/db/item_<drop_name>.ts`

If the harvestable drops a different item than the sapling:

```typescript
import { DBItem, ItemCategory } from '../item_type';

export const item_berry: DBItem = {
  id: 14,
  name: 'Berry',
  display_name: 'Berry',
  category: ItemCategory.RESOURCE,
  stack_size: 99,
  sprite: 'item_berry',
};
```

### Step 7: Register Items in Item Database

**File:** `packages/static-game-data/src/lib/items/items.ts`

Import and add your items to the items array:

```typescript
import { item_berry_seed } from './db/item_berry_seed';
import { item_berry } from './db/item_berry';

export const items: DBItem[] = [
  // ... existing items
  item_berry_seed,
  item_berry,
];
```

### Step 8: Update Tool Targeting (Optional)

**File:** `packages/static-game-data/src/lib/items/db/item_<tool>.ts`

If your harvestable should be harvestable by a specific tool, update the tool's `harvestableTargets`:

```typescript
export const item_wood_axe: DBItem = {
  // ... existing properties
  tool: {
    damage: 1,
    harvestableTargets: [HarvestableNames.WOOD, HarvestableNames.BERRY_BUSH],
  },
};
```

Or create a new tool specifically for your harvestable type.

### Step 9: Add Item Sprites

**Location:** `apps/game/public/assets/sprites/items/`

Add sprite files for your new items:
- `item_berry_seed.png`
- `item_berry.png`

### Step 10: Register Item Sprites in Texture Map

**File:** `packages/network-world-entities/src/lib/SpriteMap.ts`

Add your item textures to `ItemTextureMap`:

```typescript
export const ItemTextureMap: Record<string, { textureId: number }> = {
  // ... existing
  item_berry_seed: { textureId: 305 },
  item_berry: { textureId: 306 },
};
```

---

## Optional: Add Crafting Recipe

**File:** `packages/static-game-data/src/lib/recipes/db/recipe_<name>.ts`

If the sapling/seed should be craftable:

```typescript
import { DBRecipe } from '../recipe_type';

export const recipe_berry_seed: DBRecipe = {
  id: 10,
  name: 'Berry Seed',
  output_item_id: 15,                        // Sapling item ID
  output_amount: 1,
  crafting_time: 5,
  input_items: [
    { item_id: 14, amount: 3 },              // 3 berries -> 1 seed
  ],
  building_id: null,                         // null = hand crafting
};
```

---

## Checklist

- [ ] Added name to `HarvestableNames` enum
- [ ] Defined harvestable data in `Harvestable` object
- [ ] Added harvestable sprite assets
- [ ] Registered harvestable textures in `HarvestableTextureMap`
- [ ] Registered growth stage textures in `HarvestableStageTextureMap`
- [ ] Created sapling/seed item
- [ ] Created drop item (if different)
- [ ] Registered items in items array
- [ ] Updated tool targeting (if needed)
- [ ] Added item sprite assets
- [ ] Registered item textures in `ItemTextureMap`
- [ ] Added crafting recipe (optional)

---

## File Reference

| Purpose | File Path |
|---------|-----------|
| Harvestable types | `packages/static-game-data/src/lib/harvestable_type.ts` |
| Sprite textures | `packages/network-world-entities/src/lib/SpriteMap.ts` |
| Item definitions | `packages/static-game-data/src/lib/items/db/item_*.ts` |
| Item registry | `packages/static-game-data/src/lib/items/items.ts` |
| Tool definitions | `packages/static-game-data/src/lib/items/db/item_*_axe.ts` |
| Harvestable sprites | `apps/game/public/assets/sprites/harvestables/` |
| Item sprites | `apps/game/public/assets/sprites/items/` |
| Recipes | `packages/static-game-data/src/lib/recipes/db/recipe_*.ts` |

---

## Notes

- **Texture IDs must be unique** across all texture maps
- **Item IDs must be unique** in the items database
- **Growth states are optional** - omit `states` array for harvestables that don't grow
- **Spawn settings are optional** - omit `spawnSettings` for harvestables that only appear when planted
- The harvestable system handles networking, persistence, and client rendering automatically once configured
