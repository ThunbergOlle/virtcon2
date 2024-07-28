import { get_building_by_id } from '@virtcon2/static-game-data';
import { Building, Collider, Position, Sprite } from '../network-world-entities';
import { ItemTextureMap } from '../SpriteMap';
import { tileSize, toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';
import { addComponent, addEntity } from '@virtcon2/bytenetc';

export interface NewBuildingEntity {
  worldBuildingId: number;
  x: number;
  y: number;
  rotation: number;
  buildingId: number;
}

export const createNewBuildingEntity = (data: NewBuildingEntity): number => {
  const metadata = get_building_by_id(data.buildingId);
  if (!metadata) throw new Error(`Building with id ${data.buildingId} not found`);

  const building = addEntity();

  addComponent(Building, building);
  Building.worldBuildingId[building] = data.worldBuildingId;

  addComponent(Sprite, building);
  Sprite.texture[building] = ItemTextureMap[metadata.name]?.textureId ?? 0;
  Sprite.rotation[building] = data.rotation;

  addComponent(Collider, building);
  Collider.sizeWidth[building] = metadata.width * tileSize;
  Collider.sizeHeight[building] = metadata.height * tileSize;
  Collider.static[building] = 1;
  Collider.group[building] = metadata.can_collide ? GameObjectGroups.BUILDING : GameObjectGroups.BUILDING_NO_COLLIDE;

  addComponent(Position, building);
  const { x, y } = toPhaserPos(data);
  Position.x[building] = x + (((metadata.width + 1) % 2) / 2) * tileSize;
  Position.y[building] = y + (((metadata.height + 1) % 2) / 2) * tileSize;

  return building;
};
