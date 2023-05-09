import { WorldSettings } from '../config/worldSettings';

export function worldMapParser(height_map: number[][]): number[][] {
  const tilemap: number[][] = [];
  for (let x = 0; x < height_map.length; x++) {
    for (let y = 0; y < height_map[x].length; y++) {
      /*
        Tilemaps are stored with the following format:
        y is the row number
        x is the column number

        Note that this opposes how the height map is stored, which is:
        x is the row number
        y is the column number
      */
      if (!tilemap[y]) tilemap[y] = [];
      const height = height_map[x][y];
      const tileMapTexture = WorldSettings.height_map_texture_settings.find((setting) => height >= setting.min && height <= setting.max);
      /* Y is row.  */
      tilemap[y][x] = tileMapTexture?.tilemapIndex || WorldSettings.height_map_texture_not_found_index;
    }
  }


  return tilemap;
}
