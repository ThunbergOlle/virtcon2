import { LogApp, LogLevel, log } from '@shared';
import { WorldBuilding } from '@virtcon2/database-postgres';
import { InternalWorldBuildingFinishedProcessing, NetworkPacketData } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';

export default async function internal_world_building_finished_processing_packet(
  packet: NetworkPacketData<InternalWorldBuildingFinishedProcessing>,
  redisPubClient: RedisClientType,
) {
  log(`Received internal world building finished processing packet`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
  // this packet is trusted and sent by the tick server.
  const world_building_id = packet.data.world_building_id;

  // get the world building
  const world_building = await WorldBuilding.findOne({
    where: { id: world_building_id },
    relations: ['world_building_inventory', 'world_building_inventory.item', 'output_world_building', 'building', 'building.processing_requirements'],
  });
  if (!world_building) {
    log(`World building with id ${world_building_id} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

}
