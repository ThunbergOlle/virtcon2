import { RedisWorldBuilding } from '@shared';
import { NetworkPacketData, PacketType, PlaceBuildingPacket } from '@virtcon2/network-packet';
import { IWorld, addComponent, addEntity, defineSystem, defineQuery, enterQuery } from '@virtcon2/virt-bit-ecs';
import { Collider } from '../components/Collider';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { ItemTextureMap } from '../config/SpriteMap';
import { filterPacket } from '../networking/Filters';
import { GameObjectGroups, GameState } from '../scenes/Game';
import { tileSize, toPhaserPos } from '../ui/lib/coordinates';
import { Building } from '../components/Building';
import { Types } from 'phaser';
import { events } from '../events/Events';

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
    events.notify('onBuildingPressed', buildingId);
  });
};
export const handlePlaceBuildingPackets = (world: IWorld, packets: NetworkPacketData<unknown>[]) => {
  const placeBuildingPackets = filterPacket<PlaceBuildingPacket>(packets, PacketType.PLACE_BUILDING);
  /* Handle join packets. */
  for (let i = 0; i < placeBuildingPackets.length; i++) {
    createNewBuildingEntity(world, placeBuildingPackets[i].data);
  }
};

export const createNewBuildingEntity = (world: IWorld, data: RedisWorldBuilding): number => {
  const building = addEntity(world);

  addComponent(world, Building, building);
  Building.id[building] = data.id;

  addComponent(world, Sprite, building);
  Sprite.texture[building] = ItemTextureMap[data.building.item?.name]?.textureId ?? 0;

  addComponent(world, Collider, building);
  Collider.sizeWidth[building] = data.building.width * tileSize;
  Collider.sizeHeight[building] = data.building.height * tileSize;
  Collider.static[building] = 1;
  Collider.group[building] = GameObjectGroups.BUILDING;

  addComponent(world, Position, building);
  const { x, y } = toPhaserPos(data);
  Position.x[building] = x + (((data.building.width + 1) % 2) / 2) * tileSize;
  Position.y[building] = y + (((data.building.height + 1) % 2) / 2) * tileSize;

  return building;
};
