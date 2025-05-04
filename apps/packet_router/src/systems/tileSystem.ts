import { renderDistance, TileType, TILE_LEVEL } from '@shared';
import { defineQuery, defineSerializer, defineSystem, Entity, removeEntity, World } from '@virtcon2/bytenetc';
import * as DB from '@virtcon2/database-postgres';
import { syncRemoveEntities, syncServerEntities } from '@virtcon2/network-packet';
import { createTile, fromPhaserPos, Player, Position, SerializationID, serializeConfig, Tile } from '@virtcon2/network-world-entities';
import { worldData } from '../ecs/entityWorld';
import { redisClient } from '../redis';

const tileQuery = defineQuery(Tile, Position);
const playerQuery = defineQuery(Player, Position);

export const createTileSystem = (world: World, seed: number) =>
  defineSystem(() => {
    const tileEntities = tileQuery(world);
    const playerEntities = playerQuery(world);
    if (!playerEntities.length) return;

    const removedEntities = [];
    let newEntities: Entity[] = [];

    for (let i = 0; i < playerEntities.length; i++) {
      const playerEid = playerEntities[i];
      const { x, y } = fromPhaserPos({ x: Position.x[playerEid], y: Position.y[playerEid] });

      const [minX, maxX] = [
        Math.max(x - renderDistance, worldData[world].bounds.startX),
        Math.min(x + renderDistance, worldData[world].bounds.endX),
      ];
      const [minY, maxY] = [
        Math.max(y - renderDistance, worldData[world].bounds.startY),
        Math.min(y + renderDistance, worldData[world].bounds.endY),
      ];

      newEntities = generateTilesInArea({ minX, minY, maxX, maxY }, tileEntities, world, seed);

      for (let j = 0; j < tileEntities.length; j++) {
        const tileEid = tileEntities[j];
        const { x: tileX, y: tileY } = fromPhaserPos({ x: Position.x[tileEid], y: Position.y[tileEid] });

        if (tileX >= minX && tileX <= maxX && tileY >= minY && tileY <= maxY) {
          continue;
        }
      }
    }

    for (let i = 0; i < tileEntities.length; i++) {
      const tileEid = tileEntities[i];

      if (!shouldServerKeep(playerEntities, tileEid)) {
        removedEntities.push(tileEid);
        removeEntity(world, tileEid);
      }
    }

    syncRemoveEntities(redisClient, world, world, removedEntities).then(() => {
      const serializedTiles = defineSerializer(serializeConfig[SerializationID.TILE])(world, newEntities);
      syncServerEntities(redisClient, world, world, serializedTiles, SerializationID.TILE);
    });
  });

const generateTilesInArea = (
  { minX, minY, maxX, maxY }: { minX: number; minY: number; maxX: number; maxY: number },
  existingEntities: Entity[],
  world: World,
  seed: number,
) => {
  const newEntities: Entity[] = [];
  for (let j = minX; j <= maxX; j++) {
    for (let k = minY; k <= maxY; k++) {
      if (getTileOnPosition(existingEntities, j, k)) continue;

      const heights: [[TileType, TileType], [TileType, TileType]] = [
        [DB.World.getTileAtPoint(seed, j, k), DB.World.getTileAtPoint(seed, j + 1, k)],
        [DB.World.getTileAtPoint(seed, j, k + 1), DB.World.getTileAtPoint(seed, j + 1, k + 1)],
      ];

      const { overlay, foundation, midlevel } = pickTiles(heights);

      if (overlay.tileType !== foundation) {
        const foundationTile = createTile(world, {
          x: j,
          y: k,
          height: TILE_LEVEL[foundation],
          variant: 0,
          rotation: 0,
          dualGrid: true,
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
      });

      if (midlevel) {
        const midlevelTileEntitiyId = createTile(world, {
          x: j,
          y: k,
          height: TILE_LEVEL[midlevel.tileType],
          variant: midlevel.variant,
          rotation: midlevel.rotation,
          dualGrid: true,
        });
        newEntities.push(midlevelTileEntitiyId);
      }

      newEntities.push(overlayTileEntityId);
    }
  }

  return newEntities;
};

const getTileOnPosition = (tiles: Entity[], x: number, y: number) => {
  for (let i = 0; i < tiles.length; i++) {
    const tileEid = tiles[i];
    const { x: tileX, y: tileY } = fromPhaserPos({ x: Position.x[tileEid], y: Position.y[tileEid] });

    if (tileX === x && tileY === y) {
      return tileEid;
    }
  }
};

export const shouldServerKeep = (players: Entity[], entity: Entity): boolean => {
  for (let i = 0; i < players.length; i++) {
    const playerEid = players[i];
    const { x, y } = fromPhaserPos({ x: Position.x[playerEid], y: Position.y[playerEid] });

    const [minX, maxX] = [x - renderDistance, x + renderDistance];
    const [minY, maxY] = [y - renderDistance, y + renderDistance];

    const { x: entityX, y: entityY } = fromPhaserPos({ x: Position.x[entity], y: Position.y[entity] });
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
  const foundationTile = tiles.flat().sort((a, b) => TILE_LEVEL[a] - TILE_LEVEL[b])[0];
  return foundationTile;
};

export const pickOverlayTile = (tiles: [[TileType, TileType], [TileType, TileType]]): TileType => {
  const overlayTile = tiles.flat().sort((a, b) => TILE_LEVEL[b] - TILE_LEVEL[a])[0];
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
  midlevel?: { variant: number; rotation: number; tileType: TileType };
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

  // replace overlay tiles with middle layer
  const middleTile = pickMiddleTile(tiles);
  const allMiddle = middleTile ? tiles.flat().map((tile) => (tile === overlay.tileType ? middleTile : tile)) : tiles.flat();
  const middle = pickTilesFromTop([
    [allMiddle[0], allMiddle[1]],
    [allMiddle[2], allMiddle[3]],
  ]);

  return {
    overlay: {
      ...overlay,
      rotation: 0,
    },
    midlevel: {
      ...middle,
      rotation: 0,
    },
    foundation,
  };
};
