import { RedisWorldBuilding } from '@shared';
import { IWorld, addComponent, addEntity } from '@virtcon2/virt-bit-ecs';
import { tileSize, toPhaserPos } from '../ui/lib/coordinates';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { Collider } from '../components/Collider';
import { ItemTextureMap } from '../config/SpriteMap';
import { GameObjectGroups } from '../scenes/Game';

export const createNewBuildingEntity = (world: IWorld, data: RedisWorldBuilding): number => {
  console.log(data.building.item?.name);

  const building = addEntity(world);
  addComponent(world, Sprite, building);
  Sprite.texture[building] = ItemTextureMap[data.building.item?.name]?.textureId ?? 0;
  addComponent(world, Collider, building);
  Collider.sizeWidth[building] = data.building.width * tileSize;
  Collider.sizeHeight[building] = data.building.height * tileSize;
  Collider.static[building] = 1;
  Collider.group[building] = GameObjectGroups.BUILDING;

  addComponent(world, Position, building);
  const { x, y } = toPhaserPos(data);
  Position.x[building] = x + ((data.building.width + 1) % 2) / 2 * tileSize;
  Position.y[building] = y + ((data.building.height + 1) % 2) / 2 * tileSize;
  return building;
};
