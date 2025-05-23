import { DBItemName, ResourceNames } from '@virtcon2/static-game-data';

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
    textureName: 'building_stone_drill',
    variants: ['sprites/items/building_stone_drill.png'],
    animations: [
      {
        name: 'idle',
        frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        frameRate: 20,
        repeat: -1,
        playOnCreate: true,
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
};

export const AllTextureMaps = {
  ...ItemTextureMap,
  ...ResourceTextureMap,
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
