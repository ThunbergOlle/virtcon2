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
export const ItemTextureMap: Record<DBItemName, TextureMetaData | null> = {
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
  [DBItemName.WOOD_BIG]: {
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
  [DBItemName.BUILDING_PIPE]: {
    textureId: 7,
    textureName: 'building_pipe',
    variants: ['sprites/items/building_pipe.png'],
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
    textureName: 'building_drill',
    variants: ['sprites/items/building_drill.png'],
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
  [DBItemName.BUILDING_CONVEYOR]: {
    textureId: 11,
    textureName: 'building_conveyor',
    variants: ['sprites/items/building_conveyor.png'],
    animations: [
      {
        name: 'idle',
        frames: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        frameRate: 20,
        repeat: -1,
        playOnCreate: true,
      },
      {
        name: 'idle_corner_1',
        frames: [19, 18, 17, 16],
        frameRate: 20,
        repeat: -1,
        playOnCreate: false,
      },
      {
        name: 'idle_corner_2',
        frames: [20, 21, 22, 23],
        frameRate: 20,
        repeat: -1,
        playOnCreate: false,
      },
    ],
    spriteSheetFrameWidth: 16,
    spriteSheetFrameHeight: 16,
  },
  [DBItemName.IRON]: {
    textureId: 12,
    textureName: 'iron',
    variants: ['sprites/items/iron.png'],
  },
};

export const ResourceTextureMap: Record<ResourceNames, TextureMetaData | null> = {
  [ResourceNames.WOOD_BIG]: {
    textureId: 100,
    textureName: 'resource_wood_big',
    variants: ['sprites/resources/wood_big.png'],
  },
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
    ],
    spriteSheetFrameWidth: 16,
    spriteSheetFrameHeight: 16,
  },
  unknown: {
    textureId: 0,
    textureName: 'unknown',
    variants: ['sprites/misc/unknown.png'],
  },
};
export const AllTextureMaps = {
  ...ItemTextureMap,
  ...ResourceTextureMap,
  ...MiscTextureMap,
};
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
