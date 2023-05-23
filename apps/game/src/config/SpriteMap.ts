import { DBItemName, ResourceNames } from '@virtcon2/static-game-data';

export interface TextureMetaData {
  textureId: number; // for ECS
  textureName: string; // for Phaser
  texturePath: string; // for Phaser
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
};

export const ResourceTextureMap: Record<ResourceNames, TextureMetaData | null> = {
  [ResourceNames.WOOD]: {
    textureId: 100,
    textureName: 'resource_wood',
    texturePath: 'sprites/resources/wood.png',
  },
};

export const MiscTextureMap: Record<string, TextureMetaData | null> = {
  player_character: {
    textureId: 1000,
    textureName: 'player_character',
    texturePath: 'sprites/player_tmp.png',
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
