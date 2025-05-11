export const TILE_TYPE = {
  //DEEP_WATER: 'deep_water',
  //MEDIUM_DEEP_WATER: 'medium_deep_water',
  //MEDIUM_WATER: 'medium_water',
  //BEACH: 'beach',
  //GRASS: 'grass',
  //DARK_GRASS: 'dark_grass',
  //DIRT: 'dirt',
  //MOUNTAIN: 'mountain',
  //MEDIUM_MOUNTAIN: 'medium_mountain',
  //HIGH_MOUNTAIN: 'high_mountain',
  WATER: 'water',
  SAND: 'sand',
  GRASS: 'grass',
} as const;

export type TileType = (typeof TILE_TYPE)[keyof typeof TILE_TYPE];

export const TILE_LEVEL = {
  //[TILE_TYPE.DEEP_WATER]: -1,
  //[TILE_TYPE.MEDIUM_DEEP_WATER]: -0.85,
  //[TILE_TYPE.MEDIUM_WATER]: -0.7,
  //[TILE_TYPE.BEACH]: -0.5,
  //[TILE_TYPE.GRASS]: -0.3,
  //[TILE_TYPE.DARK_GRASS]: 0.1,
  //[TILE_TYPE.DIRT]: 0.15,
  //[TILE_TYPE.MOUNTAIN]: 0.2,
  //[TILE_TYPE.MEDIUM_MOUNTAIN]: 0.4,
  //[TILE_TYPE.HIGH_MOUNTAIN]: 0.6,
  [TILE_TYPE.WATER]: -1,
  [TILE_TYPE.SAND]: 0,
  [TILE_TYPE.GRASS]: 0.15,
} as const;

export const WorldSettings = {
  world_size: 50,
  height_map_texture_not_found_index: 0,
};

export const renderDistance = 12;

export const plotSize = 16;
