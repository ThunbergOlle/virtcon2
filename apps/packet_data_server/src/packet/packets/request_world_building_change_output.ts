import { LogApp, LogLevel } from '@shared';
import { WorldBuilding } from '@virtcon2/database-postgres';
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
  await WorldBuilding.update({ id: packet.data.building_id }, { output_pos_x: packet.data.output_pos_x, output_pos_y: packet.data.output_pos_y });


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
