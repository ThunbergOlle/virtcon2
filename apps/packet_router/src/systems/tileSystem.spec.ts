import { TILE_LEVEL, TILE_TYPE, TileType } from '@shared';
import { pickTiles, pickFoundationTile } from './tileSystem';

describe('TileSystem', () => {
  describe('pickFoundationTile', () => {
    describe('when picking a foundation tile', () => {
      test('pick in ascending tile level order', () => {
        const tiles: [[TileType, TileType], [TileType, TileType]] = [
          [TILE_TYPE.GRASS, TILE_TYPE.GRASS],
          [TILE_TYPE.SAND, TILE_TYPE.SAND],
        ];

        const foundationTile = pickFoundationTile(tiles);
        expect(foundationTile).toEqual(TILE_TYPE.SAND);
      });
    });
  });
  describe('when generating', () => {
    describe('a 2x2 tilemap being', () => {
      test(`
Sand, Sand
Sand, Sand
`, () => {
        const surroundingTiles: [[TileType, TileType], [TileType, TileType]] = [
          [TILE_TYPE.SAND, TILE_TYPE.SAND],
          [TILE_TYPE.SAND, TILE_TYPE.SAND],
        ];

        expect(pickTiles(surroundingTiles)).toEqual({
          overlay: { variant: 6, rotation: 0, tileType: TILE_TYPE.SAND },
          foundation: TILE_TYPE.SAND,
        });
      });

      test(`
Sand, Grass
Grass, Sand
`, () => {
        const surroundingTiles: [[TileType, TileType], [TileType, TileType]] = [
          [TILE_TYPE.SAND, TILE_TYPE.GRASS],
          [TILE_TYPE.GRASS, TILE_TYPE.SAND],
        ];

        expect(pickTiles(surroundingTiles)).toEqual({
          overlay: { variant: 8, rotation: 0, tileType: TILE_TYPE.GRASS },
          foundation: TILE_TYPE.SAND,
        });
      });

      test(`
Water, Grass
Grass, Water
`, () => {
        const surroundingTiles: [[TileType, TileType], [TileType, TileType]] = [
          [TILE_TYPE.WATER, TILE_TYPE.GRASS],
          [TILE_TYPE.GRASS, TILE_TYPE.WATER],
        ];

        expect(pickTiles(surroundingTiles)).toEqual({
          overlay: { variant: 8, rotation: 0, tileType: TILE_TYPE.GRASS },
          foundation: TILE_TYPE.WATER,
        });
      });

      test(`
Grass, Grass
Grass, Sand
`, () => {
        const surroundingTiles: [[TileType, TileType], [TileType, TileType]] = [
          [TILE_TYPE.GRASS, TILE_TYPE.GRASS],
          [TILE_TYPE.GRASS, TILE_TYPE.SAND],
        ];

        expect(pickTiles(surroundingTiles)).toEqual({
          overlay: { variant: 9, rotation: 0, tileType: TILE_TYPE.GRASS },
          foundation: TILE_TYPE.SAND,
        });
      });
    });
  });
});
