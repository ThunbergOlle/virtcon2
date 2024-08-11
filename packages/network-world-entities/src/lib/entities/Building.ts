import { addComponent, addEntity, World } from '@virtcon2/bytenetc';
import { building_conveyor, get_building_by_id } from '@virtcon2/static-game-data';
import { Building, Collider, Conveyor, Position, Sprite } from '../network-world-entities';
import { ItemTextureMap } from '../SpriteMap';
import { tileSize, toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';

export interface NewBuildingEntity {
  worldBuildingId: number;
  outputX: number;
  outputY: number;
  x: number;
  y: number;
  rotation: number;
  buildingId: number;
}

export const CUSTOM_BUILDING_CREATOR = {
  [building_conveyor.id]: (world: World, eid: number) => {
    addComponent(world, Conveyor, eid);
  },
};

export const worldBuildingEntityComponents = [Building, Sprite, Collider, Position, Conveyor];
export const createNewBuildingEntity = (world: World, data: NewBuildingEntity): number => {
  const metadata = get_building_by_id(data.buildingId);
  if (!metadata) throw new Error(`Building with id ${data.buildingId} not found`);

  const building = addEntity(world);

  addComponent(world, Building, building);
  Building.worldBuildingId[building] = data.worldBuildingId;
  Building.outputX[building] = 0;
  Building.outputY[building] = 0;

  addComponent(world, Sprite, building);
  Sprite.texture[building] = ItemTextureMap[metadata.name]?.textureId ?? 0;
  Sprite.rotation[building] = data.rotation;
  Sprite.variant[building] = 0;

  addComponent(world, Collider, building);
  Collider.sizeWidth[building] = metadata.width * tileSize;
  Collider.sizeHeight[building] = metadata.height * tileSize;
  Collider.static[building] = 1;
  Collider.group[building] = metadata.can_collide ? GameObjectGroups.BUILDING : GameObjectGroups.BUILDING_NO_COLLIDE;

  addComponent(world, Position, building);
  const { x, y } = toPhaserPos(data);
  Position.x[building] = x + (((metadata.width + 1) % 2) / 2) * tileSize;
  Position.y[building] = y + (((metadata.height + 1) % 2) / 2) * tileSize;

  if (CUSTOM_BUILDING_CREATOR[data.buildingId]) CUSTOM_BUILDING_CREATOR[data.buildingId](world, building);

  return building;
};
