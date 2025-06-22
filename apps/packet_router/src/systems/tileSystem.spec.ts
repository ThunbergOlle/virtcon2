import { TILE_TYPE, TileType, renderDistance } from '@shared';
import { clearEntities, createWorld, registerComponents, addEntity, addComponent, defineQuery } from '@virtcon2/bytenetc';
import { createNewPlayerEntity, Position, tileSize, allComponents, createTile, Tile, GrowableTile } from '@virtcon2/network-world-entities';
import { pickTiles, pickFoundationTile, shouldServerKeep, createTileSystem } from './tileSystem';

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
          overlay: { variant: 0, rotation: 0, tileType: TILE_TYPE.SAND },
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

          expect(shouldServerKeep(world, [playerEid], tile)).toEqual(false);
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

          expect(shouldServerKeep(world, [playerEid], tile)).toEqual(false);
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

          expect(shouldServerKeep(world, [playerEid], tile)).toEqual(false);
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

          expect(shouldServerKeep(world, [playerEid], tile)).toEqual(true);
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

          expect(shouldServerKeep(world, [playerEid], tile)).toEqual(true);
        });
      });
    });
  });
});

describe('createTileSystem()', () => {
  describe('manage tile entities', () => {
    describe('around a player', () => {
      test('spawning / despawning player is out of bounds', () => {
        const world = createWorld('test');
        registerComponents(world, allComponents);

        const playerEid = createNewPlayerEntity(world, { userId: 1, name: 'TestPlayer', position: [0, 0] });

        const tileSystem = createTileSystem(world, 1);

        const growableTileQuery = defineQuery(Position, GrowableTile);

        tileSystem({
          worldData: {
            bounds: {
              startX: 0,
              endX: 10,
              startY: 0,
              endY: 0,
            },
          },
          removeEntities: [],
          sync: [],
        });

        const growableTiles = growableTileQuery(world);
        expect(growableTiles.length).toEqual(renderDistance + 1);

        // player in the middle
        Position.x[playerEid] = 5 * tileSize;
        Position.y[playerEid] = 0;

        tileSystem({
          worldData: {
            bounds: {
              startX: 0,
              endX: 10,
              startY: 0,
              endY: 0,
            },
          },
          removeEntities: [],
          sync: [],
        });

        const newGrowableTiles = growableTileQuery(world);
        expect(newGrowableTiles.length).toEqual(9);

        // move player out of bounds
        Position.x[playerEid] = 20 * tileSize;
        Position.y[playerEid] = 0;

        tileSystem({
          worldData: {
            bounds: {
              startX: 0,
              endX: 10,
              startY: 0,
              endY: 0,
            },
          },
          removeEntities: [],
          sync: [],
        });

        const outOfBoundsGrowableTiles = growableTileQuery(world);
        expect(outOfBoundsGrowableTiles.length).toEqual(0);

        // move player back in bounds
        Position.x[playerEid] = 5 * tileSize;
        Position.y[playerEid] = 0;

        tileSystem({
          worldData: {
            bounds: {
              startX: 0,
              endX: 10,
              startY: 0,
              endY: 0,
            },
          },
          removeEntities: [],
          sync: [],
        });

        const backInBoundsGrowableTiles = growableTileQuery(world);
        expect(backInBoundsGrowableTiles.length).toEqual(9);
      });
    });
  });
});
