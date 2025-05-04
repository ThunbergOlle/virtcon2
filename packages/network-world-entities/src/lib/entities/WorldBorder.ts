import { Collider, Position, Sprite } from '../network-world-entities';

import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { AllTextureMaps } from '../SpriteMap';
import { toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';

export const worldBorderEntityComponents = [Position, Sprite, Collider];

export const createNewWorldBorderTile = (world: World, data: { x: number; y: number }): number => {
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

  return entity;
};
