import { LogApp, LogLevel } from '@shared';
import { AppDataSource, WorldBuilding } from '@virtcon2/database-postgres';
import { NetworkPacketDataWithSender, RequestWorldBuildingChangeOutput, RequestWorldBuildingPacket } from '@virtcon2/network-packet';
import { log } from 'console';
import { RedisClientType } from 'redis';
import request_world_building_packet from './request_world_building_packet';

export default async function request_world_building_change_output(
  packet: NetworkPacketDataWithSender<RequestWorldBuildingChangeOutput>,
  redisPubClient: RedisClientType,
) {
  const world_building = await WorldBuilding.findOne({ where: { id: packet.data.building_id } });
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
  console.log(occupies)

  if (occupies.length > 0) {
    const matched_building = await WorldBuilding.findOne({ where: { id: occupies[0].id } });
    world_building.output_world_building = matched_building;
  } else {
    world_building.output_world_building = null;
  }

  await world_building.save();

  const request_world_building_packet_data: NetworkPacketDataWithSender<RequestWorldBuildingPacket> = {
    packet_sender: packet.packet_sender,
    packet_type: packet.packet_type,
    data: {
      building_id: packet.data.building_id,
    },
    world_id: packet.world_id,
  };

  request_world_building_packet(request_world_building_packet_data, redisPubClient);
}
