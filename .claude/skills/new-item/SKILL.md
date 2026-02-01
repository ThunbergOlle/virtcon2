---
name: new-item
description: Interactive guide for adding a new item to the game. Asks questions about item type and properties, then guides through implementation.
---

# Adding a New Item

This skill guides you through adding a new item to the game. It will ask questions about the item you want to create and then guide you through all the necessary steps.

## Overview

Items in Virtcon2 can be:
- **Basic Items**: Resources, materials, consumables
- **Tools**: Axes, pickaxes, or other harvestable/resource gathering tools
- **Buildings**: Placeable structures that process items
- **Seeds/Saplings**: Items that plant harvestables (see `new-harvestable` skill)

---

## Interactive Setup

**IMPORTANT:** When this skill is invoked, you MUST use the AskUserQuestion tool to gather information about the item before proceeding with implementation.

### Phase 1: Item Type and Basic Properties

Use AskUserQuestion to ask:

1. **Item Type**
   - Question: "What type of item are you adding?"
   - Options:
     - Basic item (resource, material, consumable)
     - Tool (axe, pickaxe, etc.)
     - Building (sawmill, drill, furnace, etc.)
     - Seed/Sapling (plantable item)

2. **Basic Properties** (always ask)
   - Item name (internal identifier, e.g., "berry_seed")
   - Display name (shown to players, e.g., "Berry Seed")
   - Description (tooltip text)
   - Stack size (suggest: 1 for tools, 64 for common items, 99 for resources)
   - Rarity: common, uncommon, rare, epic, or legendary

3. **Sprite Status**
   - Question: "Do you have the sprite asset ready?"
   - Note: Sprite should be added to `apps/game/public/assets/sprites/items/`
   - Get sprite filename

### Phase 2: Type-Specific Properties

Based on the item type selected, use AskUserQuestion to gather additional details:

**For Tools:**
- Question: "What resources should this tool be able to harvest?"
- Options: Wood, Stone, Coal, Iron (multiSelect: true)
- Damage per hit (numeric input from user)
- Question: "What harvestables should this tool be able to harvest?"
- Options: Trees (WOOD), Carrots (CARROT), Berry Bushes (BERRY_BUSH) (multiSelect: true)

**For Buildings:**
- Width and height in tiles
- Question: "Should this building be rotatable?"
- Question: "Should this building collide with entities?"
- Processing time in ticks
- Question: "What inventory slot types does this building need?"
- Options: Input, Output, Fuel (multiSelect: true)
- What items can it be placed on? (e.g., stone, coal, iron ore)
- Output item and quantity
- Processing requirements (fuel/resources needed)
- Question: "Does this building have animations?"
- If yes: number of frames, frame rate, sprite sheet dimensions

**For Seeds/Saplings:**
- Question: "Which harvestable does this seed/sapling plant?"
- Options: List available harvestables (WOOD, BERRY_BUSH, CARROT, etc.)
- Note: If the harvestable doesn't exist yet, suggest using the `new-harvestable` skill first

### Phase 3: Crafting Recipe (Optional)

- Question: "Should this item be craftable?"
- If yes:
  - Input items and quantities (user provides list)
  - Question: "Where can this be crafted?"
  - Options: "By hand (no building required)", "Specific building (requires building)"

---

## Implementation Steps

Once the questions are answered, follow these steps:

### Step 1: Add Item Name to Enum

**File:** `packages/static-game-data/src/lib/items/item_type.ts`

Add your item name to the `DBItemName` enum:

```typescript
export enum DBItemName {
  // ... existing items
  BERRY_SEED = 'berry_seed',
}
```

### Step 2: Create Item Definition File

**File:** `packages/static-game-data/src/lib/items/db/item_<name>.ts`

Create a new file for your item:

#### Basic Item Example:
```typescript
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_berry: DBItem = {
  id: 15,                              // Unique ID - check existing items for next available
  name: DBItemName.BERRY,
  display_name: 'Berry',
  description: 'A delicious berry.',
  icon: 'berry.png',
  stack_size: 99,
  rarity: DBItemRarity.common,
  is_building: false,
};

export default item_berry;
```

#### Tool Example:
```typescript
import { HarvestableNames } from '../../harvestable_type';
import { ResourceNames } from '../../resources/resources_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';
import { ToolType } from '../tool_type';

const ID = 16;

export const stone_axe: DBItem = {
  id: ID,
  name: DBItemName.STONE_AXE,
  display_name: 'Stone Axe',
  description: 'A stronger axe for chopping trees',
  icon: 'stone_axe.png',
  rarity: DBItemRarity.uncommon,
  stack_size: 1,
  is_building: false,
};

export const stone_axe_tool: ToolType = {
  item: DBItemName.STONE_AXE,
  damage: 2,
  targets: [ResourceNames.WOOD],
  harvestableTargets: [HarvestableNames.WOOD],
};
```

#### Building Example:
```typescript
import { DBBuilding, WorldBuildingInventorySlotType } from '../building_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';
import item_wood from './item_wood';
import item_stone from './item_stone';

const ID = 17;

export const item_workbench: DBItem = {
  id: ID,
  name: DBItemName.BUILDING_WORKBENCH,
  display_name: 'Workbench',
  description: 'A crafting station for tools',
  icon: 'workbench.png',
  rarity: DBItemRarity.common,
  stack_size: 64,
  is_building: true,
  buildingId: ID,
};

export const building_workbench: DBBuilding = {
  name: DBItemName.BUILDING_WORKBENCH,
  id: ID,
  height: 1,
  width: 2,
  item: item_workbench,
  processing_ticks: 60,
  is_rotatable: true,
  inventory_slots: [
    WorldBuildingInventorySlotType.INPUT,
    WorldBuildingInventorySlotType.INPUT,
    WorldBuildingInventorySlotType.OUTPUT,
  ],
  items_to_be_placed_on: [],           // Empty = can place anywhere
  processing_requirements: [],          // No fuel needed
  output_item: null,                    // Depends on recipe
  output_quantity: null,
  can_collide: true,
};
```

#### Seed/Sapling Example:
```typescript
import { Harvestable, HarvestableNames } from '../../harvestable_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_berry_seed: DBItem = {
  id: 18,
  name: DBItemName.BERRY_SEED,
  display_name: 'Berry Seed',
  description: 'Plant this to grow berry bushes.',
  icon: 'berry_seed.png',
  stack_size: 99,
  rarity: DBItemRarity.common,
  is_building: false,
  harvestable: Harvestable[HarvestableNames.BERRY_BUSH],
};

export default item_berry_seed;
```

**Key Notes:**
- Choose a unique `id` value
- For buildings, `id` should match `buildingId`
- For tools, export both the item and the tool configuration
- For seeds/saplings, reference an existing harvestable

### Step 3: Add Sprite Asset

**Location:** `apps/game/public/assets/sprites/items/<icon_filename>`

Add your sprite file. For buildings with animations, use a sprite sheet.

**Naming Convention:** Use the same filename as specified in the `icon` field.

### Step 4: Register Sprite in Texture Map

**File:** `packages/network-world-entities/src/lib/SpriteMap.ts`

Add your item to the `ItemTextureMap`:

#### Basic Item Texture:
```typescript
export const ItemTextureMap: { [key in DBItemName]: TextureMetaData | null } = {
  // ... existing items
  [DBItemName.BERRY]: {
    textureId: 200,                    // Unique texture ID
    textureName: 'berry',
    variants: ['sprites/items/berry.png'],
  },
};
```

#### Animated Building Texture:
```typescript
export const ItemTextureMap: { [key in DBItemName]: TextureMetaData | null } = {
  // ... existing items
  [DBItemName.BUILDING_WORKBENCH]: {
    textureId: 201,
    textureName: 'building_workbench',
    variants: ['sprites/items/building_workbench.png'],
    animations: [
      {
        name: 'idle',
        frames: [0],
        frameRate: 0,
        repeat: -1,
        playOnCreate: true,
      },
      {
        name: 'active',
        frames: [0, 1, 2, 3],
        frameRate: 10,
        repeat: -1,
      },
    ],
    spriteSheetFrameWidth: 32,         // Frame width in pixels
    spriteSheetFrameHeight: 32,        // Frame height in pixels
  },
};
```

**Important:** Choose a unique `textureId` that doesn't conflict with existing textures.

### Step 5: Add Crafting Recipe (Optional)

**File:** `packages/static-game-data/src/lib/items_recipe/db/item_<name>.ts`

If the item should be craftable:

```typescript
import item_wood from '../../items/db/item_wood';
import item_stone from '../../items/db/item_stone';
import { stone_axe } from '../../items/db/item_stone_axe';
import { DBItemRecipe } from '../item_recipe_type';

export const stone_axe_recipe: DBItemRecipe[] = [
  {
    id: 200,                           // Unique recipe ID
    requiredItem: item_wood,
    requiredQuantity: 5,
    resultingItem: stone_axe,
  },
  {
    id: 201,
    requiredItem: item_stone,
    requiredQuantity: 3,
    resultingItem: stone_axe,
  },
];
```

**Note:** Each required item gets its own recipe entry with a unique ID.

### Step 6: Register Item in Database (if applicable)

Some items may need to be registered in additional locations depending on the codebase structure. Check how other similar items are registered.

### Step 7: Update Tool Registries (For Tools Only)

**File:** Look for where tools are registered (may vary based on codebase structure)

Ensure your tool is properly registered so it can be equipped and used.

### Step 8: Update Building Systems (For Buildings Only)

Buildings may require additional integration with:
- Building placement system
- Building processing/production systems
- Inventory management systems

Review existing building implementations for guidance.

---

## Checklist

- [ ] Added item name to `DBItemName` enum
- [ ] Created item definition file in `db/` directory
- [ ] For tools: Created `ToolType` export
- [ ] For buildings: Created `DBBuilding` export
- [ ] For seeds: Linked to existing harvestable
- [ ] Added sprite asset to `apps/game/public/assets/sprites/items/`
- [ ] Registered sprite in `ItemTextureMap`
- [ ] For animated buildings: Configured animations and sprite sheet dimensions
- [ ] Created crafting recipe (if applicable)
- [ ] Tested in-game (spawning, using, crafting)

---

## File Reference

| Purpose | File Path |
|---------|-----------|
| Item name enum | `packages/static-game-data/src/lib/items/item_type.ts` |
| Item definitions | `packages/static-game-data/src/lib/items/db/item_*.ts` |
| Tool type interface | `packages/static-game-data/src/lib/items/tool_type.ts` |
| Building type interface | `packages/static-game-data/src/lib/items/building_type.ts` |
| Sprite textures | `packages/network-world-entities/src/lib/SpriteMap.ts` |
| Crafting recipes | `packages/static-game-data/src/lib/items_recipe/db/item_*.ts` |
| Item sprites | `apps/game/public/assets/sprites/items/` |

---

## Examples by Type

### Resource Item (Simple)
- Wood, Stone, Coal (see `item_wood.ts`, `item_stone.ts`, `item_coal.ts`)

### Tool Item
- Wood Axe, Wood Pickaxe (see `item_wood_axe.ts`, `item_wood_pickaxe.ts`)

### Building Item
- Sawmill, Drill (see `item_sawmill.ts`, `item_drill.ts`)

### Seed/Sapling Item
- Sapling, Carrot Seed (see `item_sapling.ts`, `item_carrot_seed.ts`)

---

## Important Notes

- **Item IDs must be unique** across all items
- **Texture IDs must be unique** across all texture maps
- **Recipe IDs must be unique** across all recipes
- Buildings require more complex integration than basic items
- For harvestables, use the `new-harvestable` skill first, then create the seed/sapling
- Test thoroughly in-game after adding any new item
- Consider balance: stack sizes, rarities, crafting costs, tool damage, building processing times

---

## Next Steps After Implementation

1. Test spawning the item in-game
2. Test crafting the item (if it has a recipe)
3. For tools: Test harvesting resources/harvestables
4. For buildings: Test placement and processing
5. For seeds: Test planting and growth
6. Verify sprite displays correctly
7. Check that all properties work as expected
