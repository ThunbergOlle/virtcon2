import { TILE_TYPE, TileType, renderDistance } from '@shared';
import { clearEntities, createWorld, registerComponents, addEntity, addComponent } from '@virtcon2/bytenetc';
import { Position, tileSize } from '@virtcon2/network-world-entities';
import { pickTiles, pickFoundationTile, shouldServerKeep } from './tileSystem';

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

      test(`
Sand, Sand
Grass, Sand
`, () => {
        const surroundingTiles: [[TileType, TileType], [TileType, TileType]] = [
          [TILE_TYPE.SAND, TILE_TYPE.SAND],
          [TILE_TYPE.GRASS, TILE_TYPE.SAND],
        ];

        expect(pickTiles(surroundingTiles)).toEqual({
          overlay: { variant: 12, rotation: 0, tileType: TILE_TYPE.GRASS },
          foundation: TILE_TYPE.SAND,
        });
      });

      test(`
Sand, Sand
Sand, Grass
`, () => {
        const surroundingTiles: [[TileType, TileType], [TileType, TileType]] = [
          [TILE_TYPE.SAND, TILE_TYPE.SAND],
          [TILE_TYPE.SAND, TILE_TYPE.GRASS],
        ];

        expect(pickTiles(surroundingTiles)).toEqual({
          overlay: { variant: 13, rotation: 0, tileType: TILE_TYPE.GRASS },
          foundation: TILE_TYPE.SAND,
        });
      });
    });
  });

  describe('shouldServerKeep())', () => {
    const world = createWorld('test');

    beforeAll(() => {
      registerComponents(world, [Position]);
    });

    beforeEach(() => {
      clearEntities(world);
    });

    describe("don't keep if entity", () => {
      describe('is outside the render distance', () => {
        test('by 2 tiles', () => {
          const playerEid = addEntity(world);
          addComponent(world, Position, playerEid);
          Position.x[playerEid] = 0;
          Position.y[playerEid] = 0;

          const tile = addEntity(world);
          addComponent(world, Position, tile);
          Position.x[tile] = renderDistance * tileSize + tileSize * 2;
          Position.y[tile] = renderDistance * tileSize + tileSize * 2;

          expect(shouldServerKeep([playerEid], tile)).toEqual(false);
        });

        test('by 1 tile', () => {
          const playerEid = addEntity(world);
          addComponent(world, Position, playerEid);
          Position.x[playerEid] = 0;
          Position.y[playerEid] = 0;

          const tile = addEntity(world);
          addComponent(world, Position, tile);
          Position.x[tile] = renderDistance * tileSize + tileSize * 1;
          Position.y[tile] = renderDistance * tileSize + tileSize * 1;

          expect(shouldServerKeep([playerEid], tile)).toEqual(false);
        });

        test('by -1 tile', () => {
          const playerEid = addEntity(world);
          addComponent(world, Position, playerEid);
          Position.x[playerEid] = 0;
          Position.y[playerEid] = 0;

          const tile = addEntity(world);
          addComponent(world, Position, tile);
          Position.x[tile] = -renderDistance * tileSize + tileSize * -1;
          Position.y[tile] = -renderDistance * tileSize + tileSize * -1;

          expect(shouldServerKeep([playerEid], tile)).toEqual(false);
        });
      });
    });

    describe('keep if entity', () => {
      describe('is inside the render distance', () => {
        test('by 1 tile', () => {
          const playerEid = addEntity(world);
          addComponent(world, Position, playerEid);
          Position.x[playerEid] = 0;
          Position.y[playerEid] = 0;

          const tile = addEntity(world);
          addComponent(world, Position, tile);
          Position.x[tile] = renderDistance * tileSize + tileSize * -1;
          Position.y[tile] = renderDistance * tileSize + tileSize * -1;

          expect(shouldServerKeep([playerEid], tile)).toEqual(true);
        });

        test('by 2 tiles', () => {
          const playerEid = addEntity(world);
          addComponent(world, Position, playerEid);
          Position.x[playerEid] = 0;
          Position.y[playerEid] = 0;

          const tile = addEntity(world);
          addComponent(world, Position, tile);
          Position.x[tile] = renderDistance * tileSize + tileSize * -2;
          Position.y[tile] = renderDistance * tileSize + tileSize * -2;

          expect(shouldServerKeep([playerEid], tile)).toEqual(true);
        });
      });
    });
  });
});
