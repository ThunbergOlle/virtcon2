import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { Position, Sprite, Tile, tileSize, toPhaserPos } from '../network-world-entities';
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
