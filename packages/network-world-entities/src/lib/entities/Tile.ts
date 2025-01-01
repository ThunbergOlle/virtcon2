import { addComponent, addEntity, World } from "@virtcon2/bytenetc";
import { Position, Sprite, Tile, toPhaserPos } from "../network-world-entities";
import { TileTextureMap } from "../SpriteMap";
import { TILE_LEVEL, TILE_TYPE } from '@shared';

export const tileEntityComponents = [Position, Sprite, Tile];
export const createTile = (x: number, y: number, height: number, world: World) => {
  const eid = addEntity(world);

  addComponent(world, Sprite, eid);

  const tileType = getLayer(height);
  const texture = TileTextureMap[tileType]?.textureId;

  Sprite.texture[eid] = texture!;
  Sprite.variant[eid] = 0;
  Sprite.dynamicBody[eid] = 0;
  Sprite.opacity[eid] = 1;
  Sprite.depth[eid] = -100

  addComponent(world, Position, eid);
  const { x: phaserX, y: phaserY } = toPhaserPos({ x, y });
  Position.x[eid] = phaserX;
  Position.y[eid] = phaserY;

  const encoder = new TextEncoder();

  addComponent(world, Tile, eid);
  Tile.height[eid] = height;
  Tile.type[eid] = encoder.encode(tileType);

  return eid;
};

const getLayer = (height: number): (typeof TILE_TYPE)[keyof typeof TILE_TYPE] => {
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


