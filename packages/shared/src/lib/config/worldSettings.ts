export const WorldSettings = {
  world_size: 50,
  height_map_texture_not_found_index: 0,
  height_map_texture_settings: [
    {
      /* Deep water */
      min: -1,
      max: -0.85,
      tilemapIndex: 34,
    },
    {
      /* Medium deep water */
      min: -0.85,
      max: -0.7,
      tilemapIndex: 33,
    },
    {
      /* Medium water */
      min: -0.7,
      max: -0.5,
      tilemapIndex: 32,
    },
    {
      min: -0.5,
      max: -0.3,
      tilemapIndex: 16,
    },
    {
      min: -0.3,
      max: 0.1,
      tilemapIndex: 8,
    },
    {
      min: 0.1,
      max: 0.15,
      tilemapIndex: 9,
    },
    {
      min: 0.15,
      max: 0.2,
      tilemapIndex: 10,
    },
    {
      min: 0.2,
      max: 0.4,
      tilemapIndex: 24,
    },
    {
      min: 0.4,
      max: 0.6,
      tilemapIndex: 25,
    },
    {
      min: 0.6,
      max: 1,
      tilemapIndex: 26,
    },
  ],
};
