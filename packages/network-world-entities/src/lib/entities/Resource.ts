import { ResourceNames, Resources } from '@virtcon2/static-game-data';
import { IWorld, addEntity, addComponent } from 'bitecs';
import { Position, Sprite, Collider, Resource } from '../network-world-entities';
import { AllTextureMaps } from '../SpriteMap';
import { TileCoordinates, toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';

export const createNewResourceEntity = (
  world: IWorld,
  data: {
    resourceName: ResourceNames;
    pos: TileCoordinates;
    itemId: number;
    resourceId: number;
  },
): number => {
  const { x, y } = toPhaserPos({ x: data.pos.x, y: data.pos.y });
  const resource = addEntity(world);

  addComponent(world, Position, resource);
  Position.x[resource] = x;
  Position.y[resource] = y;

  addComponent(world, Sprite, resource);
  Sprite.texture[resource] = AllTextureMaps[data.resourceName]?.textureId ?? 0;

  addComponent(world, Collider, resource);
  Collider.sizeWidth[resource] = Resources[data.resourceName].width * 16;
  Collider.sizeHeight[resource] = Resources[data.resourceName].height * 16;
  Collider.offsetX[resource] = 0;
  Collider.offsetY[resource] = 0;
  Collider.static[resource] = 1;
  Collider.group[resource] = GameObjectGroups.RESOURCE;

  addComponent(world, Resource, resource);
  Resource.health[resource] = 5;
  Resource.itemId[resource] = data.itemId;
  Resource.id[resource] = data.resourceId;

  return resource;
};
