import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { GrowableTile, Position, Sprite, Tile, tileSize, toPhaserPos } from '../network-world-entities';
import { TileTextureMap } from '../SpriteMap';
import { TILE_LEVEL, TILE_TYPE } from '@shared';

export const tileEntityComponents = [Position, Sprite, Tile];
interface CreateTileOptions {
  x: number;
  y: number;
  height: number;
  variant?: number;
  rotation?: number;
  dualGrid?: boolean;
  depth?: number;
  isFoundation?: boolean;
  seed?: number;
}

const tileDepth = -100;

export const createTile = (world: World, options: CreateTileOptions) => {
  const eid = addEntity(world);

  addComponent(world, Sprite, eid);

  const tileType = getLayer(options.height);
  const texture = TileTextureMap[tileType]?.textureId;

  Sprite.texture[eid] = texture!;
  Sprite.dynamicBody[eid] = 0;
  Sprite.opacity[eid] = 1;
  Sprite.depth[eid] = options.depth ?? tileDepth + options.height * 5;
  Sprite.variant[eid] = options.variant ?? 0;
  Sprite.rotation[eid] = options.rotation ?? 0;

  addComponent(world, Position, eid);
  const { x: phaserX, y: phaserY } = toPhaserPos({ x: options.x, y: options.y });

  if (options.dualGrid) {
    Position.x[eid] = phaserX - tileSize / 2;
    Position.y[eid] = phaserY - tileSize / 2;
  } else {
    Position.x[eid] = phaserX;
    Position.y[eid] = phaserY;
  }

  const encoder = new TextEncoder();

  addComponent(world, Tile, eid);
  Tile.height[eid] = options.height;
  Tile.type[eid] = encoder.encode(tileType);

  if (options.isFoundation) {
    if (!options.seed) throw new Error('Seed is required for foundation tiles');
    addComponent(world, GrowableTile, eid);
    GrowableTile.hash[eid] = hashPosition(options.x, options.y, options.seed);
  }

  return eid;
};

export const getLayer = (height: number): (typeof TILE_TYPE)[keyof typeof TILE_TYPE] => {
  const tileTypes = Object.entries(TILE_LEVEL)
    .sort((a, b) => b[1] - a[1])
    .map((a) => a[0]);

  for (const tileType of tileTypes) {
    if (height >= TILE_LEVEL[tileType as keyof typeof TILE_LEVEL]) {
      return tileType as (typeof TILE_TYPE)[keyof typeof TILE_TYPE];
    }
  }
  return TILE_TYPE.WATER;
};
const hashPosition = (x: number, y: number, seed: number): number => {
  const combinedSeed = `${x},${y},${seed}`;

  let hash = 0;
  for (let i = 0; i < combinedSeed.length; i++) {
    const char = combinedSeed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }

  return hash;
};
