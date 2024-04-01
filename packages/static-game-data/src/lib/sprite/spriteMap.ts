import { DBItemName } from '../items/item_type';
import { ResourceNames } from '../resources/resources_type';

export interface TextureMetaData {
  textureId: number; // for ECS
  textureName: string; // for Phaser
  texturePath: string; // for Phaser
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
    texturePath: 'sprites/items/building_sawmill.png',
  },
  [DBItemName.WOOD]: {
    textureId: 2,
    textureName: 'wood',
    texturePath: 'sprites/items/wood.png',
  },
  [DBItemName.WOOD_BIG]: {
    textureId: 2,
    textureName: 'wood',
    texturePath: 'sprites/items/wood.png',
  },
  [DBItemName.STICK]: {
    textureId: 3,
    textureName: 'stick',
    texturePath: 'sprites/items/stick.png',
  },
  [DBItemName.SAND]: {
    textureId: 4,
    textureName: 'sand',
    texturePath: 'sprites/items/sand.png',
  },
  [DBItemName.GLASS]: {
    textureId: 5,
    textureName: 'glass',
    texturePath: 'sprites/items/glass.png',
  },
  [DBItemName.COAL]: {
    textureId: 6,
    textureName: 'coal',
    texturePath: 'sprites/items/coal.png',
  },
  [DBItemName.BUILDING_PIPE]: {
    textureId: 7,
    textureName: 'building_pipe',
    texturePath: 'sprites/items/building_pipe.png',
  },
  [DBItemName.BUILDING_FURNACE]: {
    textureId: 8,
    textureName: 'building_furnace',
    texturePath: 'sprites/items/building_furnace.png',
  },
  [DBItemName.STONE]: {
    textureId: 9,
    textureName: 'stone',
    texturePath: 'sprites/items/stone.png',
  },
  [DBItemName.BUILDING_DRILL]: {
    textureId: 10,
    textureName: 'building_drill',
    texturePath: 'sprites/items/building_drill.png',
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
    texturePath: 'sprites/items/building_conveyor.png',
    animations: [
      {
        name: 'idle',
        frames: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        frameRate: 20,
        repeat: -1,
        playOnCreate: true,
      },
    ],
    spriteSheetFrameWidth: 16,
    spriteSheetFrameHeight: 16,
  },
  [DBItemName.IRON]: {
    textureId: 12,
    textureName: 'iron',
    texturePath: 'sprites/items/iron.png',
  },
};

export const ResourceTextureMap: Record<ResourceNames, TextureMetaData | null> = {
  [ResourceNames.WOOD_BIG]: {
    textureId: 100,
    textureName: 'resource_wood_big',
    texturePath: 'sprites/resources/wood_big.png',
  },
  [ResourceNames.WOOD]: {
    textureId: 101,
    textureName: 'resource_wood',
    texturePath: 'sprites/resources/wood.png',
  },
  [ResourceNames.STONE]: {
    textureId: 102,
    textureName: 'resource_stone',
    texturePath: 'sprites/resources/stone.png',
  },
  [ResourceNames.IRON]: {
    textureId: 103,
    textureName: 'resource_iron',
    texturePath: 'sprites/resources/iron.png',
  },
  [ResourceNames.COAL]: {
    textureId: 104,
    textureName: 'resource_coal',
    texturePath: 'sprites/resources/coal.png',
  },
};

export const MiscTextureMap: Record<string, TextureMetaData | null> = {
  player_character: {
    textureId: 1000,
    textureName: 'player_character',
    texturePath: 'sprites/player_tmp.png',
  },
  unknown: {
    textureId: 0,
    textureName: 'unknown',
    texturePath: 'sprites/misc/unknown.png',
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
