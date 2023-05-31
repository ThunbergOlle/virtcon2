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

// const buildingQuery = defineQuery([Building, Position, Collider]);
// const buildingQueryEnter = enterQuery(buildingQuery);

export const createBuildingSystem = () => {
  return defineSystem((world: IWorld, state: GameState, packets) => {
    handlePlaceBuildingPackets(world, packets);
    return { world, state };
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
