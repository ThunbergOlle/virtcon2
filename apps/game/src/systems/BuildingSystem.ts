import { RedisWorldBuilding } from '@shared';
import { ClientPacket, PacketType, PlaceBuildingPacket, WorldBuildingServerPacket } from '@virtcon2/network-packet';
import { addComponent, addEntity, defineQuery, defineSystem, enterQuery, IWorld } from '@virtcon2/virt-bit-ecs';
import { Types } from 'phaser';
import { Building } from '../components/Building';
import { Collider } from '../components/Collider';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { ItemTextureMap } from '../config/SpriteMap';
import { filterPacket } from '../networking/Filters';
import { GameObjectGroups, GameState } from '../scenes/Game';
import { store } from '../store';
import { tileSize, toPhaserPos } from '../ui/lib/coordinates';
import { select, WindowType } from '../ui/lib/WindowSlice';
import { inspectBuilding } from '../ui/windows/building/inspectedBuildingSlice';

const buildingQuery = defineQuery([Building, Position, Collider]);
const buildingQueryEnter = enterQuery(buildingQuery);

export const createBuildingSystem = () => {
  return defineSystem((world: IWorld, state: GameState, packets) => {
    const enterEntities = buildingQueryEnter(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const sprite = state.spritesById[id] as Types.Physics.Arcade.SpriteWithDynamicBody;
      if (sprite) {
        setupBuildingEventListeners(sprite, id, state);
      }
    }

    return { world, state };
  });
};
const setupBuildingEventListeners = (sprite: Types.Physics.Arcade.SpriteWithDynamicBody, eid: number, state: GameState) => {
  if (!sprite.body) {
    console.error(`No body for building ${eid}`);
    return;
  }

  sprite.body.gameObject.on(Phaser.Input.Events.POINTER_DOWN, () => {
    /* Send on building pressed */
    const buildingId = state.buildingById[eid].id;
    store.dispatch(inspectBuilding(buildingId));
    store.dispatch(select(WindowType.VIEW_BUILDING));
  });
};
export const handlePlaceBuildingPackets = (world: IWorld, state: GameState, packets: ClientPacket<unknown>[]): GameState => {
  const placeBuildingPackets = filterPacket<PlaceBuildingPacket>(packets, PacketType.PLACE_BUILDING);
  /* Handle place building packets. */
  for (let i = 0; i < placeBuildingPackets.length; i++) {
    createNewBuildingEntity(world, state, placeBuildingPackets[i].data);
  }
  return state;
};
export const handleBuildingPackets = (world: IWorld, state: GameState, packets: ClientPacket<unknown>[]): GameState => {
  const worldBuildingPackets = filterPacket<WorldBuildingServerPacket>(packets, PacketType.WORLD_BUILDING);
  // get building by id
  worldBuildingPackets.forEach((packet) => {
    if (!packet.data.building) return;
    const eid = state.buildingEntityIdById[packet.data.building.id];
    if (eid) {
      Sprite.rotation[eid] = packet.data.rotation;
      const { x, y } = toPhaserPos(packet.data);
      Position.x[eid] = x + (((packet.data.building.width + 1) % 2) / 2) * tileSize;
      Position.y[eid] = y + (((packet.data.building.height + 1) % 2) / 2) * tileSize;
      state.buildingById[eid] = packet.data;
    }
  });
  return state;
};

export const createNewBuildingEntity = (world: IWorld, state: GameState, data: RedisWorldBuilding): number => {
  const building = addEntity(world);

  addComponent(world, Building, building);
  Building.id[building] = data.id;

  addComponent(world, Sprite, building);
  Sprite.texture[building] = ItemTextureMap[data.building.item?.name]?.textureId ?? 0;
  Sprite.rotation[building] = data.rotation;

  addComponent(world, Collider, building);
  Collider.sizeWidth[building] = data.building.width * tileSize;
  Collider.sizeHeight[building] = data.building.height * tileSize;
  Collider.static[building] = 1;
  Collider.group[building] = data.building.can_collide ? GameObjectGroups.BUILDING : GameObjectGroups.BUILDING_NO_COLLIDE;

  addComponent(world, Position, building);
  const { x, y } = toPhaserPos(data);
  Position.x[building] = x + (((data.building.width + 1) % 2) / 2) * tileSize;
  Position.y[building] = y + (((data.building.height + 1) % 2) / 2) * tileSize;

  state.buildingById[building] = data;

  state.buildingEntityIdById[data.id] = building;

  return building;
};
