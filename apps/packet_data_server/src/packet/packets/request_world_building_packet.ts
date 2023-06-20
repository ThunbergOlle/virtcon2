import { LogApp, LogLevel, RedisWorldBuilding, log } from '@shared';
import { WorldBuilding } from '@virtcon2/database-postgres';
import { NetworkPacketDataWithSender, PacketType, RedisPacketPublisher, RequestWorldBuildingPacket, WorldBuildingPacketData } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';

export default async function request_world_building_packet(packet: NetworkPacketDataWithSender<RequestWorldBuildingPacket>, redisPubClient: RedisClientType) {
  const building = await WorldBuilding.findOne({ where: { id: packet.data.building_id }, relations: ['building', 'world_building_inventory', 'output_world_building', 'world_building_inventory.item'] });
  if (!building) {
    log(`Building with id ${packet.data.building_id} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER)
    return;
  }
  const packet_data: WorldBuildingPacketData = {
    building: building as unknown as RedisWorldBuilding,
  };
  const player_inventory_packet = new RedisPacketPublisher(redisPubClient).packet_type(PacketType.WORLD_BUILDING).data(packet_data).target(packet.packet_target).channel(packet.world_id).build();
  await player_inventory_packet.publish();
}
