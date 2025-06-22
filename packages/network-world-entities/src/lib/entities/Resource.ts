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
  Position(world).x[resource] = x;
  Position(world).y[resource] = y;

  addComponent(world, Sprite, resource);
  Sprite(world).texture[resource] = AllTextureMaps[data.resourceName]?.textureId ?? 0;
  Sprite(world).variant[resource] = data.itemId % (AllTextureMaps[data.resourceName]?.variants.length ?? 0);
  Sprite(world).opacity[resource] = 1;

  addComponent(world, Collider, resource);
  Collider(world).sizeWidth[resource] = resourceInfo.width * 16;
  Collider(world).sizeHeight[resource] = resourceInfo.height * 16;
  Collider(world).offsetX[resource] = 0;
  Collider(world).offsetY[resource] = 0;

  if (resourceInfo.spriteHeight && resourceInfo.spriteHeight !== resourceInfo.height) {
    Collider(world).offsetY[resource] = (-(resourceInfo.height - resourceInfo.spriteHeight) * 16) / 2;
  }
  if (resourceInfo.spriteWidth && resourceInfo.spriteWidth !== resourceInfo.width) {
    Collider(world).offsetX[resource] = (-(resourceInfo.width - resourceInfo.spriteWidth) * 16) / 2;
  }

  Collider(world).static[resource] = 1;
  Collider(world).group[resource] = GameObjectGroups.RESOURCE;

  addComponent(world, Resource, resource);
  Resource(world).health[resource] = 5;
  Resource(world).itemId[resource] = data.itemId;
  Resource(world).worldBuildingId[resource] = data.worldBuildingId;

  return resource;
};
