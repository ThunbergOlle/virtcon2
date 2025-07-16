import { DBItem, Resources } from '@virtcon2/static-game-data';
import { Collider, Position, Resource, Sprite } from '../network-world-entities';

import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { AllTextureMaps } from '../SpriteMap';
import { TileCoordinates, toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';
import { InvalidInputError } from '@shared';

export const resourceEntityComponents = [Position, Sprite, Collider, Resource];

export const createNewResourceEntity = (world: World, data: { pos: TileCoordinates; item: DBItem; worldBuildingId: number }): number => {
  const { resource } = data.item;
  if (!resource) throw new InvalidInputError(`Item ${data.item.id} does not have a resource associated with it.`);
  const { x, y } = toPhaserPos({ x: data.pos.x, y: data.pos.y });
  const resourceEid = addEntity(world);
  const resourceInfo = Resources[resource.name];

  addComponent(world, Position, resourceEid);
  Position(world).x[resourceEid] = x;
  Position(world).y[resourceEid] = y;

  addComponent(world, Sprite, resourceEid);
  Sprite(world).texture[resourceEid] = AllTextureMaps[resource.name]?.textureId ?? 0;
  Sprite(world).variant[resourceEid] = (data.pos.x + data.pos.y) % (AllTextureMaps[resource.name]?.variants.length ?? 0);
  Sprite(world).opacity[resourceEid] = 1;

  addComponent(world, Collider, resourceEid);
  Collider(world).sizeWidth[resourceEid] = resourceInfo.width * 16;
  Collider(world).sizeHeight[resourceEid] = resourceInfo.height * 16;
  Collider(world).offsetX[resourceEid] = 0;
  Collider(world).offsetY[resourceEid] = 0;

  if (resourceInfo.spriteHeight && resourceInfo.spriteHeight !== resourceInfo.height) {
    Collider(world).offsetY[resourceEid] = (-(resourceInfo.height - resourceInfo.spriteHeight) * 16) / 2;
  }
  if (resourceInfo.spriteWidth && resourceInfo.spriteWidth !== resourceInfo.width) {
    Collider(world).offsetX[resourceEid] = (-(resourceInfo.width - resourceInfo.spriteWidth) * 16) / 2;
  }

  Collider(world).static[resourceEid] = 1;
  Collider(world).group[resourceEid] = GameObjectGroups.RESOURCE;

  addComponent(world, Resource, resourceEid);
  Resource(world).health[resourceEid] = resource.full_health;
  Resource(world).itemId[resourceEid] = data.item.id;
  Resource(world).worldBuildingId[resourceEid] = data.worldBuildingId;

  return resourceEid;
};
