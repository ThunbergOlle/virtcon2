import { RedisWorldBuilding } from '@shared';
import { IWorld, addComponent, addEntity } from '@virtcon2/virt-bit-ecs';
import { toPhaserPos } from '../ui/lib/coordinates';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { Collider } from '../components/Collider';
import { ItemTextureMap } from '../config/SpriteMap';

export const createNewBuildingEntity = (world: IWorld, data: RedisWorldBuilding): number => {
  const { x, y } = toPhaserPos(data);
  const building = addEntity(world);
  addComponent(world, Position, building);
  Position.x[building] = x;
  Position.y[building] = y;
  addComponent(world, Sprite, building);
  Sprite.texture[building] = ItemTextureMap[data.building.item?.name]?.textureId ?? 0;
  addComponent(world, Collider, building);
  Collider.sizeWidth[building] = data.building.width * 16;
  Collider.sizeHeight[building] = data.building.height * 16;
  Collider.static[building] = 1;
  return building;
};
