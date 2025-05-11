import { Collider, Position, Sprite, tileSize, toPhaserPos, WorldBorder } from '../network-world-entities';

import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { AllTextureMaps } from '../SpriteMap';
import { GameObjectGroups } from '../utils/gameObject';
import { plotSize } from '@shared';

export const worldBorderEntityComponents = [Position, Sprite, Collider, WorldBorder];

export enum WorldBorderSide {
  LEFT = 0,
  RIGHT = 1,
  TOP = 2,
  BOTTOM = 3,
}

export const createNewWorldBorderTile = (world: World, data: { x: number; y: number; side: WorldBorderSide }): number => {
  const entity = addEntity(world);

  const { x, y } = toPhaserPos({ x: data.x, y: data.y });

  addComponent(world, Position, entity);
  Position.x[entity] = x;
  Position.y[entity] = y;

  addComponent(world, Sprite, entity);
  Sprite.texture[entity] = AllTextureMaps['expand_plot']?.textureId ?? 0;
  Sprite.width[entity] = tileSize * plotSize;
  Sprite.height[entity] = tileSize;
  if (data.side === WorldBorderSide.LEFT || data.side === WorldBorderSide.RIGHT) {
    Sprite.rotation[entity] = 90;
  } else {
    Sprite.rotation[entity] = 0;
  }

  addComponent(world, Collider, entity);

  Collider.static[entity] = 1;
  Collider.group[entity] = GameObjectGroups.BORDER;
  if (data.side === WorldBorderSide.LEFT || data.side === WorldBorderSide.RIGHT) {
    Collider.sizeWidth[entity] = tileSize;
    Collider.sizeHeight[entity] = tileSize * (plotSize + 1);
    Collider.offsetX[entity] = (tileSize * plotSize) / 2;
    Collider.offsetY[entity] = (-tileSize * plotSize) / 2;
  }

  addComponent(world, WorldBorder, entity);
  WorldBorder.side[entity] = data.side;

  return entity;
};
