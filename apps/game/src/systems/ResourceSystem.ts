import { ResourceNames, Resources } from '@virtcon2/static-game-data';
import { IWorld, addComponent, addEntity } from '@virtcon2/virt-bit-ecs';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { TileCoordinates, toPhaserPos } from '../ui/lib/coordinates';
import { Collider } from '../components/Collider';

export const createNewResourceEntity = (
  world: IWorld,
  data: {
    resourceName: ResourceNames;
    pos: TileCoordinates;
  },
) => {
  const { x, y } = toPhaserPos({ x: data.pos.x, y: data.pos.y });
  const resource = addEntity(world);
  addComponent(world, Position, resource);
  Position.x[resource] = x;
  Position.y[resource] = y;
  addComponent(world, Sprite, resource);
  Sprite.texture[resource] = 8;
  addComponent(world, Collider, resource);
  Collider.sizeWidth[resource] = Resources[data.resourceName].width * 16;
  Collider.sizeHeight[resource] = Resources[data.resourceName].height * 16;
  Collider.offsetX[resource] = 0.5* Resources[data.resourceName].height * 16;
  Collider.offsetY[resource] = 0;
};
