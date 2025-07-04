import { plotSize, renderDistance, TileType, TILE_LEVEL } from '@shared';
import { defineQuery, defineSerializer, defineSystem, Entity, removeEntity, World } from '@virtcon2/bytenetc';
import {
  createTile,
  fromPhaserPos,
  GrowableTile,
  Player,
  Position,
  SerializationID,
  getSerializeConfig,
  Tile,
} from '@virtcon2/network-world-entities';
import { getTileAtPoint } from '@virtcon2/static-game-data';
import { clone } from 'ramda';
import { SyncEntities, WorldBounds } from './types';

export const createTileSystem = (world: World, seed: number) => {
  const tileQuery = defineQuery(Tile, Position);
  const growableTileQuery = defineQuery(GrowableTile, Position);
  const playerQuery = defineQuery(Player, Position);

  return defineSystem<SyncEntities>(({ worldData }) => {
    const tileEntities = tileQuery(world);
    const growableTileEntities = growableTileQuery(world);
    const playerEntities = playerQuery(world);

    if (!playerEntities.length) return { removeEntities: [], sync: [], worldData };

    const removedEntities = [];
    const newEntities: Entity[] = [];

    for (let i = 0; i < playerEntities.length; i++) {
      const playerEid = playerEntities[i];
      const { x, y } = fromPhaserPos({ x: Position(world).x[playerEid], y: Position(world).y[playerEid] });

      const [minX, maxX] = [x - renderDistance, x + renderDistance];
      const [minY, maxY] = [y - renderDistance, y + renderDistance];

      newEntities.push(...generateTilesInArea({ minX, minY, maxX, maxY }, worldData.bounds, growableTileEntities, world, seed));
    }

    for (let i = 0; i < tileEntities.length; i++) {
      const tileEid = tileEntities[i];

      if (!shouldServerKeep(world, playerEntities, tileEid)) {
        removedEntities.push(tileEid);
        removeEntity(world, tileEid);
      }
    }

    const serializedTiles = defineSerializer(getSerializeConfig(world)[SerializationID.TILE])(world, newEntities);
    return {
      worldData,
      removeEntities: removedEntities,
      sync: [
        {
          data: serializedTiles,
          serializationId: SerializationID.TILE,
        },
      ],
    };
  });
};

const generateTilesInArea = (
  { minX, minY, maxX, maxY }: { minX: number; minY: number; maxX: number; maxY: number },
  worldBounds: WorldBounds[],
  existingEntities: Entity[],
  world: World,
  seed: number,
) => {
  const newEntities: Entity[] = [];
  for (let j = minX; j <= maxX; j++) {
    for (let k = minY; k <= maxY; k++) {
      const isWithinBounds = worldBounds.some(({ x, y }) => {
        const [minX, maxX] = [x, x + plotSize];
        const [minY, maxY] = [y, y + plotSize];
        return j >= minX && j <= maxX && k >= minY && k <= maxY;
      });

      if (!isWithinBounds) continue;
      if (getTileOnPosition(existingEntities, j, k, world)) continue;

      const heights: [[TileType, TileType], [TileType, TileType]] = [
        [getTileAtPoint(seed, j, k), getTileAtPoint(seed, j + 1, k)],
        [getTileAtPoint(seed, j, k + 1), getTileAtPoint(seed, j + 1, k + 1)],
      ];

      const { overlay, foundation } = pickTiles(heights);

      if (overlay.tileType !== foundation) {
        const foundationTile = createTile(world, {
          x: j,
          y: k,
          height: TILE_LEVEL[foundation],
          variant: 0,
          rotation: 0,
          dualGrid: true,
          seed,
          isFoundation: true,
        });

        newEntities.push(foundationTile);
      }

      const overlayTileEntityId = createTile(world, {
        x: j,
        y: k,
        height: TILE_LEVEL[overlay.tileType],
        variant: overlay.variant,
        rotation: overlay.rotation,
        dualGrid: true,
        isFoundation: foundation === overlay.tileType,
        seed,
      });

      newEntities.push(overlayTileEntityId);
    }
  }

  return newEntities;
};

const getTileOnPosition = (tiles: Entity[], x: number, y: number, world: World) => {
  for (let i = 0; i < tiles.length; i++) {
    const tileEid = tiles[i];
    const { x: tileX, y: tileY } = fromPhaserPos({ x: Position(world).x[tileEid], y: Position(world).y[tileEid] });

    if (tileX === x && tileY === y) {
      return tileEid;
    }
  }
};

export const shouldServerKeep = (world: World, players: Entity[], entity: Entity): boolean => {
  for (let i = 0; i < players.length; i++) {
    const playerEid = players[i];
    const { x, y } = fromPhaserPos({ x: Position(world).x[playerEid], y: Position(world).y[playerEid] });

    const [minX, maxX] = [x - renderDistance, x + renderDistance];
    const [minY, maxY] = [y - renderDistance, y + renderDistance];

    const { x: entityX, y: entityY } = fromPhaserPos({ x: Position(world).x[entity], y: Position(world).y[entity] });
    if (entityX >= minX && entityX <= maxX && entityY >= minY && entityY <= maxY) {
      return true;
    }
  }

  return false;
};

type SimplifiedVariant = [[boolean, boolean], [boolean, boolean]];

const gridVariant1: SimplifiedVariant = [
  [true, true],
  [true, true],
];

const gridVariant2: SimplifiedVariant = [
  [false, true],
  [false, false],
];

const gridVariant3: SimplifiedVariant = [
  [false, true],
  [false, true],
];

const gridVariant4: SimplifiedVariant = [
  [false, true],
  [true, true],
];

const gridVariant5: SimplifiedVariant = [
  [true, true],
  [false, false],
];

const gridVariant6: SimplifiedVariant = [
  [true, false],
  [true, true],
];

const gridVariant7: SimplifiedVariant = [
  [true, false],
  [false, true],
];

const gridVariant8: SimplifiedVariant = [
  [true, true],
  [false, true],
];

const gridVariant9: SimplifiedVariant = [
  [false, true],
  [true, false],
];

const gridVariant10: SimplifiedVariant = [
  [true, true],
  [true, false],
];

const gridVariant11: SimplifiedVariant = [
  [true, false],
  [true, false],
];

const gridVariant12: SimplifiedVariant = [
  [true, false],
  [false, false],
];

const gridVariant13: SimplifiedVariant = [
  [false, false],
  [true, false],
];

const gridVariant14: SimplifiedVariant = [
  [false, false],
  [false, true],
];

const gridVariant15: SimplifiedVariant = [
  [false, false],
  [true, true],
];

const isVariant = (variant: SimplifiedVariant, surroundingTileHeights: SimplifiedVariant) =>
  variant.every((row, i) => row.every((bool, j) => bool === surroundingTileHeights[i][j]));

export const pickFoundationTile = (tiles: [[TileType, TileType], [TileType, TileType]]): TileType => {
  const foundationTile = clone(tiles.flat().sort((a, b) => TILE_LEVEL[a] - TILE_LEVEL[b])[0]);
  return foundationTile;
};

export const pickOverlayTile = (tiles: [[TileType, TileType], [TileType, TileType]]): TileType => {
  const overlayTile = clone(tiles.flat().sort((a, b) => TILE_LEVEL[b] - TILE_LEVEL[a])[0]);
  return overlayTile;
};

export const pickMiddleTile = (tiles: [[TileType, TileType], [TileType, TileType]]): TileType | undefined => {
  const overlayTileType = pickOverlayTile(tiles);
  const foundationTileType = pickFoundationTile(tiles);
  return tiles.flat().filter((tileType) => tileType !== overlayTileType && tileType !== foundationTileType)[0];
};

export const pickTiles = (
  tiles: [[TileType, TileType], [TileType, TileType]],
): {
  overlay: { variant: number; rotation: number; tileType: TileType };
  foundation: TileType;
} => {
  const foundation = pickFoundationTile(tiles);

  const pickTilesFromTop = (tiles: [[TileType, TileType], [TileType, TileType]]): { variant: number; tileType: TileType } => {
    const overlayTileType = pickOverlayTile(tiles);

    const toBools = [
      [tiles[0][0] === overlayTileType, tiles[0][1] === overlayTileType],
      [tiles[1][0] === overlayTileType, tiles[1][1] === overlayTileType],
    ] as SimplifiedVariant;

    const variants = [
      { pattern: gridVariant1, id: 0 },
      { pattern: gridVariant2, id: 1 },
      { pattern: gridVariant3, id: 2 },
      { pattern: gridVariant4, id: 3 },
      { pattern: gridVariant5, id: 4 },
      { pattern: gridVariant6, id: 5 },
      { pattern: gridVariant7, id: 6 },
      { pattern: gridVariant8, id: 7 },
      { pattern: gridVariant9, id: 8 },
      { pattern: gridVariant10, id: 9 },
      { pattern: gridVariant11, id: 10 },
      { pattern: gridVariant12, id: 11 },
      { pattern: gridVariant13, id: 12 },
      { pattern: gridVariant14, id: 13 },
      { pattern: gridVariant15, id: 14 },
    ];

    for (const { pattern, id } of variants) {
      if (isVariant(pattern, toBools)) {
        return { variant: id, tileType: overlayTileType };
      }
    }

    throw new Error(`No matching variant found for tiles: ${JSON.stringify(tiles)}`);
  };

  const overlay = pickTilesFromTop(tiles);

  return {
    overlay: {
      ...overlay,
      rotation: 0,
    },
    foundation,
  };
};
