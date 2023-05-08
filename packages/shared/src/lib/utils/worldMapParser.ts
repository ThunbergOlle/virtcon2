import { WorldSettings } from '../config/worldSettings';

export function worldMapParser(height_map: number[][]): number[][] {
  const tilemap: number[][] = [];
  for (let row = 0; row < height_map.length; row++) {
    tilemap[row] = [];
    for (let col = 0; col < height_map[row].length; col++) {
      const height = height_map[row][col];
      const tilemapIndexValue = WorldSettings.height_map_texture_settings.find((setting) => height >= setting.min && height <= setting.max)?.tilemapIndex;
      tilemap[row][col] = tilemapIndexValue || WorldSettings.height_map_texture_not_found_index;
    }
  }
  return tilemap;
}
