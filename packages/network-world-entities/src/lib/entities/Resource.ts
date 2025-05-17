import { ResourceNames, Resources } from '@virtcon2/static-game-data';
import { Collider, Position, Resource, Sprite } from '../network-world-entities';

import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { AllTextureMaps } from '../SpriteMap';
import { TileCoordinates, toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';

export const resourceEntityComponents = [Position, Sprite, Collider, Resource];

export const createNewResourceEntity = (
  world: World,
  data: { resourceName: ResourceNames; pos: TileCoordinates; itemId: number; worldBuildingId: number },
): number => {
  const { x, y } = toPhaserPos({ x: data.pos.x, y: data.pos.y });
  const resource = addEntity(world);
  const resourceInfo = Resources[data.resourceName];

  addComponent(world, Position, resource);
  Position.x[resource] = x;
  Position.y[resource] = y;

  addComponent(world, Sprite, resource);
  Sprite.texture[resource] = AllTextureMaps[data.resourceName]?.textureId ?? 0;
  Sprite.variant[resource] = data.itemId % (AllTextureMaps[data.resourceName]?.variants.length ?? 0);
  Sprite.opacity[resource] = 1;

  addComponent(world, Collider, resource);
  Collider.sizeWidth[resource] = resourceInfo.width * 16;
  Collider.sizeHeight[resource] = resourceInfo.height * 16;
  Collider.offsetX[resource] = 0;
  Collider.offsetY[resource] = 0;

  if (resourceInfo.spriteHeight && resourceInfo.spriteHeight !== resourceInfo.height) {
    Collider.offsetY[resource] = (-(resourceInfo.height - resourceInfo.spriteHeight) * 16) / 2;
  }
  if (resourceInfo.spriteWidth && resourceInfo.spriteWidth !== resourceInfo.width) {
    Collider.offsetX[resource] = (-(resourceInfo.width - resourceInfo.spriteWidth) * 16) / 2;
  }

  Collider.static[resource] = 1;
  Collider.group[resource] = GameObjectGroups.RESOURCE;

  addComponent(world, Resource, resource);
  Resource.health[resource] = 5;
  Resource.itemId[resource] = data.itemId;
  Resource.worldBuildingId[resource] = data.worldBuildingId;

  return resource;
};
