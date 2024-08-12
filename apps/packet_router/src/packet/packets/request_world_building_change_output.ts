import { LogApp, LogLevel } from '@shared';
import { defineQuery, defineSerializer } from '@virtcon2/bytenetc';
import { AppDataSource, publishWorldBuildingUpdate, WorldBuilding } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestWorldBuildingChangeOutput, syncServerEntities } from '@virtcon2/network-packet';
import { Building, SerializationID, serializeConfig, Sprite } from '@virtcon2/network-world-entities';
import { log } from 'console';
import { RedisClientType } from 'redis';

export default async function worldBuildingChangeOutput(packet: ClientPacketWithSender<RequestWorldBuildingChangeOutput>) {
  const world_building = await WorldBuilding.findOne({ where: { id: packet.data.building_id }, relations: ['building'] });
  if (!world_building) {
    log(
      `Building with id ${packet.data.building_id} not found. Cannot change output of building that is non-existant`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // change the output
  world_building.output_pos_x = packet.data.output_pos_x;
  world_building.output_pos_y = packet.data.output_pos_y;

  // query and check if there is a building on the position that we set as output
  const occupies = await AppDataSource.query(
    `select wb.id
  from world_building as wb
  inner join building as b
  on b."id" = wb."buildingId"
  where wb."worldId"=$3 and $1 >= wb.x and $1 <= wb.x+b.width - 1 and $2 >= wb.y and $2 <= wb.y+b.height - 1;`,
    [packet.data.output_pos_x, packet.data.output_pos_y, packet.world_id],
  );

  if (occupies.length > 0) {
    const matched_building = await WorldBuilding.findOne({ where: { id: occupies[0].id } });
    world_building.output_world_building = matched_building;
  } else world_building.output_world_building = null;
  if (world_building.building.is_rotatable) world_building.rotation = getRotationFromOutputPosition(world_building);

  return world_building.save();
}

export const requestWorldBuildingChangeOutput = async (packet: ClientPacketWithSender<RequestWorldBuildingChangeOutput>, client: RedisClientType) => {
  const world_building = await worldBuildingChangeOutput(packet);
  publishWorldBuildingUpdate(world_building.id);

  const buildings = defineQuery(Building)(world_building.worldId);
  const eid = buildings.find((b) => Building.worldBuildingId[b] === world_building.id);

  Sprite.rotation[eid] = world_building.rotation;

  const serialize = defineSerializer(serializeConfig[SerializationID.BUILDING_FULL_SERVER]);
  const serializedBuilding = serialize(packet.world_id, [eid]);

  return syncServerEntities(client, packet.world_id, packet.world_id, serializedBuilding, SerializationID.BUILDING_FULL_SERVER);
};

// return radians
function getRotationFromOutputPosition(worldBuilding: WorldBuilding): number {
  const isOutputLeft = worldBuilding.output_pos_x < worldBuilding.x;
  const isOutputRight = worldBuilding.output_pos_x > worldBuilding.x + worldBuilding.building.width - 1;
  const isOutputTop = worldBuilding.output_pos_y < worldBuilding.y;
  const isOutputBottom = worldBuilding.output_pos_y > worldBuilding.y + worldBuilding.building.height - 1;

  if (isOutputLeft) return 180;
  if (isOutputRight) return 0;
  if (isOutputTop) return 90;
  if (isOutputBottom) return 270;
}
