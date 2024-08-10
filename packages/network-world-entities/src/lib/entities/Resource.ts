import { ResourceNames, Resources } from '@virtcon2/static-game-data';
import { Position, Sprite, Collider, Resource } from '../network-world-entities';
import { AllTextureMaps } from '../SpriteMap';
import { TileCoordinates, toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';
import { addComponent, addEntity, World } from '@virtcon2/bytenetc';

export const createNewResourceEntity = (
  world: World,
  data: { resourceName: ResourceNames; pos: TileCoordinates; itemId: number; resourceId: number; worldBuildingId: number },
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
  Resource.worldBuildingId[resource] = data.worldBuildingId;

  return resource;
};
