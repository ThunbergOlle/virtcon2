import { InventoryType, LogApp, LogLevel, log } from '@shared';
import { UserInventoryItem, WorldBuilding, WorldBuildingInventory } from '@virtcon2/database-postgres';
import { NetworkPacketDataWithSender, RequestMoveInventoryItemPacketData, RequestWorldBuildingPacket } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import request_player_inventory_packet from './request_player_inventory_packet';
import request_world_building_packet from './request_world_building_packet';

export default async function request_move_inventory_item_packet(packet: NetworkPacketDataWithSender<RequestMoveInventoryItemPacketData>, redisPubClient: RedisClientType) {
  /* Handle differently depending on if items moves between player inventory or building inventory */

  if (packet.data.fromInventoryType === InventoryType.PLAYER && packet.data.toInventoryType === InventoryType.BUILDING) {
    /* Player wants to put in items into a building */
    // check if the player has the item

    const player_inventory_item = await UserInventoryItem.findOne({ where: { id: packet.data.item.id, user: { id: packet.packet_sender.id } }, relations: ['item'] });
    if (!player_inventory_item) {
      log(`Player ${packet.packet_sender.id} does not have item ${packet.data.item.id} but tried to move it from their inventory! Sus 📮`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return;
    }
    // get the building
    const building_to_drop_in = await WorldBuilding.findOne({ where: { id: packet.data.toInventoryId } });
    if (!building_to_drop_in) {
      log(`Building with id ${packet.data.toInventoryId} not found. Cannot move item to inventory that is non-existant`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return;
    }

    // remove the items from the player
    UserInventoryItem.addToInventory(packet.packet_sender.id, packet.data.item.id, -packet.data.quantity);
    // add the items to the building
    WorldBuildingInventory.addToInventory(building_to_drop_in.id, packet.data.item.id, packet.data.quantity);

    // send the updated inventory to the player and to the building
    request_player_inventory_packet(packet, redisPubClient);
    const request_world_building_packet_data: NetworkPacketDataWithSender<RequestWorldBuildingPacket> = {
      packet_sender: packet.packet_sender,
      packet_type: packet.packet_type,
      data: {
        building_id: building_to_drop_in.id,
      },
      world_id: packet.world_id,
    };

    request_world_building_packet(request_world_building_packet_data, redisPubClient);
  }
}
