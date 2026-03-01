import { DBItemName, HarvestableNames, ResourceNames } from '@virtcon2/static-game-data';

export interface TextureMetaData {
  textureId: number; // for ECS
  textureName: string; // for Phaser
  variants: string[]; // for Phaser
  animations?: {
    name: string;
    frames: number[];
    frameRate: number;
    repeat: number;
    playOnCreate?: boolean;
  }[];
  spriteSheetFrameWidth?: number;
  spriteSheetFrameHeight?: number;
}
export const ItemTextureMap: { [key in DBItemName]: TextureMetaData | null } = {
  [DBItemName.BUILDING_SAWMILL]: {
    textureId: 1,
    textureName: 'building_sawmill',
    variants: ['sprites/items/building_sawmill.png'],
    animations: [
      {
        name: 'idle',
        frames: [0, 1],
        frameRate: 20,
        repeat: -1,
        playOnCreate: true,
      },
    ],
    spriteSheetFrameWidth: 16,
    spriteSheetFrameHeight: 16,
  },
  [DBItemName.WOOD]: {
    textureId: 2,
    textureName: 'wood',
    variants: ['sprites/items/wood.png'],
  },
  [DBItemName.STICK]: {
    textureId: 3,
    textureName: 'stick',
    variants: ['sprites/items/stick.png'],
  },
  [DBItemName.SAND]: {
    textureId: 4,
    textureName: 'sand',
    variants: ['sprites/items/sand.png'],
  },
  [DBItemName.GLASS]: {
    textureId: 5,
    textureName: 'glass',
    variants: ['sprites/items/glass.png'],
  },
  [DBItemName.COAL]: {
    textureId: 6,
    textureName: 'coal',
    variants: ['sprites/items/coal.png'],
  },
  [DBItemName.BUILDING_FURNACE]: {
    textureId: 8,
    textureName: 'building_furnace',
    variants: ['sprites/items/building_furnace.png'],
  },
  [DBItemName.STONE]: {
    textureId: 9,
    textureName: 'stone',
    variants: ['sprites/items/stone.png'],
  },
  [DBItemName.BUILDING_DRILL]: {
    textureId: 10,
    textureName: 'coal_powered_drill',
    variants: ['sprites/items/coal_powered_drill.png'],
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
        frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        frameRate: 20,
        repeat: -1,
      },
    ],
    spriteSheetFrameWidth: 16,
    spriteSheetFrameHeight: 16,
  },
  [DBItemName.IRON_ORE]: {
    textureId: 12,
    textureName: 'iron_ore',
    variants: ['sprites/items/iron_ore.png'],
  },
  [DBItemName.WOOD_AXE]: {
    textureId: 13,
    textureName: 'wood_axe',
    variants: ['sprites/items/wood_axe.png'],
  },
  [DBItemName.WOOD_PICKAXE]: {
    textureId: 14,
    textureName: 'wood_pickaxe',
    variants: ['sprites/items/wood_pickaxe.png'],
  },
  [DBItemName.STONE_PICKAXE]: {
    textureId: 15,
    textureName: 'stone_pickaxe',
    variants: ['sprites/items/stone_pickaxe.png'],
  },
  [DBItemName.SAPLING]: {
    textureId: 16,
    textureName: 'sapling',
    variants: ['sprites/items/sapling.png'],
  },
  [DBItemName.CARROT]: {
    textureId: 17,
    textureName: 'carrot',
    variants: ['sprites/items/carrot.png'],
  },
  [DBItemName.CARROT_SEED]: {
    textureId: 18,
    textureName: 'carrot_seed',
    variants: ['sprites/items/carrot_seed.png'],
  },
  [DBItemName.BUILDING_INSERTER]: {
    textureId: 20,
    textureName: 'building_inserter',
    variants: ['sprites/buildings/building_inserter.png'],
    animations: [
      // Idle animations (one per direction) — indices 0-3
      { name: 'idle_right', frames: [4], frameRate: 0, repeat: -1, playOnCreate: true },
      { name: 'idle_down', frames: [6], frameRate: 0, repeat: -1 },
      { name: 'idle_left', frames: [0], frameRate: 0, repeat: -1 },
      { name: 'idle_up', frames: [2], frameRate: 0, repeat: -1 },
      // Pickup animations (idle → output, play once) — indices 4-7
      { name: 'pickup_right', frames: [4, 5, 6, 7, 0], frameRate: 10, repeat: 0 },
      { name: 'pickup_down', frames: [6, 7, 0, 1, 2], frameRate: 10, repeat: 0 },
      { name: 'pickup_left', frames: [0, 1, 2, 3, 4], frameRate: 10, repeat: 0 },
      { name: 'pickup_up', frames: [2, 3, 4, 5, 6], frameRate: 10, repeat: 0 },
      // Return animations (output → idle, play once) — indices 8-11
      { name: 'return_right', frames: [0, 1, 2, 3, 4], frameRate: 10, repeat: 0 },
      { name: 'return_down', frames: [2, 3, 4, 5, 6], frameRate: 10, repeat: 0 },
      { name: 'return_left', frames: [4, 5, 6, 7, 0], frameRate: 10, repeat: 0 },
      { name: 'return_up', frames: [6, 7, 0, 1, 2], frameRate: 10, repeat: 0 },
    ],
    spriteSheetFrameWidth: 48,
    spriteSheetFrameHeight: 48,
  },
  [DBItemName.BUILDING_CRATE]: {
    textureId: 21,
    textureName: 'building_crate',
    variants: ['sprites/items/building_crate.png'],
  },
  [DBItemName.BUILDING_CONVEYOR]: {
    textureId: 19,
    textureName: 'building_conveyor',
    variants: ['sprites/buildings/building_conveyor.png'],
    animations: [
      // Straight animations — indices 0-3 match Conveyor.direction values
      { name: 'active_right', frames: [145, 151, 157, 163, 169, 175, 181], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'active_down', frames: [59, 65, 71, 77, 83, 89, 95], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'active_left', frames: [97, 103, 109, 115, 121, 127, 133], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'active_up', frames: [52, 58, 64, 70, 76, 82, 88], frameRate: 12, repeat: -1, playOnCreate: false },
      // Curve animations — indices 4-11
      { name: 'curve_south_east', frames: [0, 6, 12, 18, 24, 30, 36], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'curve_east_south', frames: [2, 8, 14, 20, 26, 32, 38], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'curve_south_west', frames: [3, 9, 15, 21, 27, 33, 39], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'curve_west_north', frames: [57, 63, 69, 75, 81, 87, 93], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'curve_north_east', frames: [56, 62, 68, 74, 80, 86, 92], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'curve_north_west', frames: [3, 9, 15, 21, 27, 33, 39], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'curve_west_south', frames: [1, 7, 13, 19, 25, 31, 37], frameRate: 12, repeat: -1, playOnCreate: false },
      { name: 'curve_east_north', frames: [0, 6, 12, 18, 24, 30, 36], frameRate: 12, repeat: -1, playOnCreate: false },
    ],
    spriteSheetFrameWidth: 16,
    spriteSheetFrameHeight: 16,
  },
};

export const HarvestableTextureMap: Record<HarvestableNames, TextureMetaData | null> = {
  [HarvestableNames.WOOD]: {
    textureId: 301,
    textureName: 'harvestable_wood',
    variants: ['sprites/harvestables/harvestable_wood.png'],
    spriteSheetFrameWidth: 64,
    spriteSheetFrameHeight: 96,
  },
  [HarvestableNames.CARROT]: {
    textureId: 303,
    textureName: 'harvestable_carrot_3',
    variants: ['sprites/harvestables/harvestable_carrot_3.png'],
    spriteSheetFrameWidth: 32,
    spriteSheetFrameHeight: 32,
  },
};

export const HarvestableStageTextureMap: Record<string, TextureMetaData | null> = {
  harvestable_wood_small: {
    textureId: 302,
    textureName: 'harvestable_wood_small',
    variants: ['sprites/harvestables/harvestable_wood_small.png'],
    spriteSheetFrameWidth: 64,
    spriteSheetFrameHeight: 96,
  },
  harvestable_wood_medium: {
    textureId: 303,
    textureName: 'harvestable_wood_medium',
    variants: ['sprites/harvestables/harvestable_wood_medium.png'],
    spriteSheetFrameWidth: 64,
    spriteSheetFrameHeight: 96,
  },
  harvestable_wood: {
    textureId: 304,
    textureName: 'harvestable_wood',
    variants: ['sprites/harvestables/harvestable_wood.png'],
    spriteSheetFrameWidth: 64,
    spriteSheetFrameHeight: 96,
  },
  harvestable_carrot_0: {
    textureId: 305,
    textureName: 'harvestable_carrot_0',
    variants: ['sprites/harvestables/harvestable_carrot_0.png'],
    spriteSheetFrameWidth: 32,
    spriteSheetFrameHeight: 32,
  },
  harvestable_carrot_1: {
    textureId: 306,
    textureName: 'harvestable_carrot_1',
    variants: ['sprites/harvestables/harvestable_carrot_1.png'],
    spriteSheetFrameWidth: 32,
    spriteSheetFrameHeight: 32,
  },
  harvestable_carrot_2: {
    textureId: 307,
    textureName: 'harvestable_carrot_2',
    variants: ['sprites/harvestables/harvestable_carrot_2.png'],
    spriteSheetFrameWidth: 32,
    spriteSheetFrameHeight: 32,
  },
  harvestable_carrot_3: {
    textureId: 308,
    textureName: 'harvestable_carrot_3',
    variants: ['sprites/harvestables/harvestable_carrot_3.png'],
    spriteSheetFrameWidth: 32,
    spriteSheetFrameHeight: 32,
  },
};

export const ResourceTextureMap: Record<ResourceNames, TextureMetaData | null> = {
  [ResourceNames.WOOD]: {
    textureId: 101,
    textureName: 'resource_wood',
    variants: ['sprites/resources/wood.png', 'sprites/resources/wood_1.png'],
  },
  [ResourceNames.STONE]: {
    textureId: 102,
    textureName: 'resource_stone',
    variants: ['sprites/resources/stone_0.png', 'sprites/resources/stone_1.png', 'sprites/resources/stone_2.png'],
  },
  [ResourceNames.IRON]: {
    textureId: 103,
    textureName: 'resource_iron',
    variants: ['sprites/resources/iron.png'],
  },
  [ResourceNames.COAL]: {
    textureId: 104,
    textureName: 'resource_coal',
    variants: ['sprites/resources/coal.png'],
  },
};

export const TileTextureMap: Record<string, TextureMetaData | null> = {
  water: {
    textureId: 200,
    textureName: 'water',
    variants: ['sprites/tiles/water.png'],
  },
  sand: {
    textureId: 201,
    textureName: 'sand',
    variants: [
      'sprites/tiles/sand/v1.png',
      'sprites/tiles/sand/v2.png',
      'sprites/tiles/sand/v3.png',
      'sprites/tiles/sand/v4.png',
      'sprites/tiles/sand/v5.png',
      'sprites/tiles/sand/v6.png',
      'sprites/tiles/sand/v7.png',
      'sprites/tiles/sand/v8.png',
      'sprites/tiles/sand/v9.png',
      'sprites/tiles/sand/v10.png',
      'sprites/tiles/sand/v11.png',
      'sprites/tiles/sand/v12.png',
      'sprites/tiles/sand/v13.png',
      'sprites/tiles/sand/v14.png',
      'sprites/tiles/sand/v15.png',
    ],
  },
  grass: {
    textureId: 202,
    textureName: 'grass',
    variants: [
      'sprites/tiles/grass/v1.png',
      'sprites/tiles/grass/v2.png',
      'sprites/tiles/grass/v3.png',
      'sprites/tiles/grass/v4.png',
      'sprites/tiles/grass/v5.png',
      'sprites/tiles/grass/v6.png',
      'sprites/tiles/grass/v7.png',
      'sprites/tiles/grass/v8.png',
      'sprites/tiles/grass/v9.png',
      'sprites/tiles/grass/v10.png',
      'sprites/tiles/grass/v11.png',
      'sprites/tiles/grass/v12.png',
      'sprites/tiles/grass/v13.png',
      'sprites/tiles/grass/v14.png',
      'sprites/tiles/grass/v15.png',
    ],
  },
};

export const MiscTextureMap: Record<string, TextureMetaData | null> = {
  player_character: {
    textureId: 1000,
    textureName: 'player_character',
    variants: ['sprites/player_tmp.png'],
    animations: [
      {
        name: 'idle',
        frames: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        frameRate: 10,
        repeat: -1,
        playOnCreate: true,
      },
      {
        name: 'walk',
        frames: [12, 13, 14, 15, 16, 17, 18, 19],
        frameRate: 10,
        repeat: -1,
      },
      {
        name: 'cut',
        frames: [20, 21, 22, 23],
        frameRate: 10,
        repeat: 0,
      },
    ],
    spriteSheetFrameWidth: 64,
    spriteSheetFrameHeight: 64,
  },
  unknown: {
    textureId: 0,
    textureName: 'unknown',
    variants: ['sprites/misc/unknown.png'],
  },
  expand_plot: {
    textureId: 999,
    textureName: 'expand_plot',
    variants: ['sprites/misc/expand_plot.png'],
  },
  cursor_highlighter: {
    textureId: 1001,
    textureName: 'cursor_highlighter',
    variants: ['sprites/misc/cursor_highlighter.png'],
  },
};

export const AllTextureMaps = {
  ...ItemTextureMap,
  ...ResourceTextureMap,
  ...HarvestableTextureMap,
  ...HarvestableStageTextureMap,
  ...MiscTextureMap,
  ...TileTextureMap,
} as const;

export const getTextureNameFromTextureId = (textureId: number): string | null => {
  const allTextureMaps = Object.keys(AllTextureMaps) as string[];
  for (const textureMapKey of allTextureMaps) {
    const textureMap = AllTextureMaps[textureMapKey as keyof typeof AllTextureMaps];
    if (textureMap && textureMap.textureId === textureId) {
      return textureMap.textureName;
    }
  }
  return null;
};

export const getTextureFromTextureId = (textureId: number): TextureMetaData | null => {
  const allTextureMaps = Object.keys(AllTextureMaps) as string[];
  for (const textureMapKey of allTextureMaps) {
    const textureMap = AllTextureMaps[textureMapKey as keyof typeof AllTextureMaps];
    if (textureMap && textureMap.textureId === textureId) {
      return textureMap;
    }
  }
  return null;
};

export const getVariantName = (texture: TextureMetaData, variant: number): string => `${texture.textureName}_${variant}`;
