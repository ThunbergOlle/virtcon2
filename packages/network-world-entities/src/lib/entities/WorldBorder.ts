import { Collider, Position, Sprite, WorldBorder } from '../network-world-entities';

import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { AllTextureMaps } from '../SpriteMap';
import { toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';

export const worldBorderEntityComponents = [Position, Sprite, Collider, WorldBorder];

export enum WorldBorderSide {
  LEFT = 0,
  RIGHT = 1,
  TOP = 2,
  BOTTOM = 3,
}

export const createNewWorldBorderTile = (world: World, data: { x: number; y: number; side: WorldBorderSide }): number => {
  const { x, y } = toPhaserPos({ x: data.x, y: data.y });
  const entity = addEntity(world);

  addComponent(world, Position, entity);
  Position.x[entity] = x;
  Position.y[entity] = y;

  addComponent(world, Sprite, entity);
  Sprite.texture[entity] = AllTextureMaps['cloud']?.textureId ?? 0;

  addComponent(world, Collider, entity);
  Collider.sizeWidth[entity] = 16;
  Collider.sizeHeight[entity] = 16;

  Collider.static[entity] = 1;
  Collider.group[entity] = GameObjectGroups.BORDER;

  addComponent(world, WorldBorder, entity);
  WorldBorder.side[entity] = data.side;

  return entity;
};
