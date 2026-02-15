import { addComponent, addEntity, Entity, World } from '@virtcon2/bytenetc';
import { DBItemName, get_building_by_id } from '@virtcon2/static-game-data';
import { Animation, Building, Collider, Conveyor, Inserter, Position, Sprite } from '../network-world-entities';
import { ItemTextureMap } from '../SpriteMap';
import { tileSize, toPhaserPos } from '../utils/coordinates';
import { GameObjectGroups } from '../utils/gameObject';

export interface NewBuildingEntity {
  worldBuildingId: number;
  x: number;
  y: number;
  rotation: number;
  buildingId: number;
}

export const worldBuildingEntityComponents = [Animation, Building, Sprite, Collider, Position, Inserter];
export const createNewBuildingEntity = (world: World, data: NewBuildingEntity): Entity => {
  const metadata = get_building_by_id(data.buildingId);
  if (!metadata) throw new Error(`Building with id ${data.buildingId} not found`);

  const building = addEntity(world);

  addComponent(world, Building, building);
  Building(world).worldBuildingId[building] = data.worldBuildingId;

  addComponent(world, Sprite, building);
  Sprite(world).texture[building] = ItemTextureMap[metadata.name]?.textureId ?? 0;
  Sprite(world).rotation[building] = data.rotation;
  Sprite(world).variant[building] = 0;

  if (metadata.name === DBItemName.BUILDING_CONVEYOR) {
    Sprite(world).depth[building] = -25;
  }

  addComponent(world, Collider, building);
  Collider(world).sizeWidth[building] = metadata.width * tileSize;
  Collider(world).sizeHeight[building] = metadata.height * tileSize;
  Collider(world).static[building] = 1;
  Collider(world).group[building] = metadata.can_collide ? GameObjectGroups.BUILDING : GameObjectGroups.BUILDING_NO_COLLIDE;

  addComponent(world, Position, building);
  const { x, y } = toPhaserPos(data);
  Position(world).x[building] = x + (((metadata.width + 1) % 2) / 2) * tileSize;
  Position(world).y[building] = y + (((metadata.height + 1) % 2) / 2) * tileSize;

  // Add Animation component - starts with idle animation (index 0), playing
  addComponent(world, Animation, building);
  Animation(world).animationIndex[building] = 0; // idle
  Animation(world).isPlaying[building] = 1;

  switch (metadata.name) {
    case DBItemName.BUILDING_INSERTER:
      return createNewInserterEntity(world, data, building);
    case DBItemName.BUILDING_CONVEYOR:
      return createNewConveyorEntity(world, data, building);
    default:
      return building;
  }
};

export const createNewInserterEntity = (world: World, data: NewBuildingEntity, eid: Entity): Entity => {
  Sprite(world).width[eid] = 48;
  Sprite(world).height[eid] = 48;
  Sprite(world).rotation[eid] = 0; // No sprite rotation — direction is baked into animation frames
  const direction = Math.floor(data.rotation / 90) % 4;
  Animation(world).animationIndex[eid] = direction; // idle animation for this direction

  addComponent(world, Inserter, eid);
  Inserter(world).direction[eid] = Math.floor(data.rotation / 90) % 4;
  Inserter(world).heldItemId[eid] = 0;
  Inserter(world).enabled[eid] = 1;

  return eid;
};

export const createNewConveyorEntity = (world: World, data: NewBuildingEntity, eid: Entity): Entity => {
  addComponent(world, Conveyor, eid);
  Conveyor(world).direction[eid] = Math.floor(data.rotation / 90) % 4;
  Conveyor(world).speed[eid] = 1.5; // pixels per tick

  return eid;
};
