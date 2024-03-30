import { LogApp, LogLevel, RedisWorldBuilding, log } from '@shared';
import { WorldBuilding } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, enqueuePacket, PacketType, RequestWorldBuildingPacket, WorldBuildingPacketData } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';

export default async function request_world_building_packet(packet: ClientPacketWithSender<RequestWorldBuildingPacket>, redisPubClient: RedisClientType) {
  const building = await WorldBuilding.findOne({
    where: { id: packet.data.building_id },
    relations: ['building', 'world_building_inventory', 'output_world_building', 'world_building_inventory.item'],
  });
  if (!building) {
    log(`Building with id ${packet.data.building_id} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }
  const packet_data: WorldBuildingPacketData = {
    building: building as unknown as RedisWorldBuilding,
  };

  return enqueuePacket(redisPubClient, packet.world_id, {
    packet_type: PacketType.WORLD_BUILDING,
    target: packet.packet_target,
    sender: packet.sender,
    data: packet_data,
  });
}
