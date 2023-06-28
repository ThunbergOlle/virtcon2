import { InventoryType, LogApp, LogLevel, log } from '@shared';
import { UserInventoryItem, WorldBuilding, WorldBuildingInventory, InventoryFullError } from '@virtcon2/database-postgres';
import { NetworkPacketDataWithSender, RequestMoveInventoryItemPacketData, RequestWorldBuildingPacket } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import request_player_inventory_packet from './request_player_inventory_packet';
import request_world_building_packet from './request_world_building_packet';

export default async function request_move_inventory_item_packet(
  packet: NetworkPacketDataWithSender<RequestMoveInventoryItemPacketData>,
  redisPubClient: RedisClientType,
) {
  /* Handle differently depending on if items moves between player inventory or building inventory */

  if (packet.data.fromInventoryType === InventoryType.PLAYER && packet.data.toInventoryType === InventoryType.BUILDING) {
    request_move_inventory_item_to_building(packet, redisPubClient);
  } else if (packet.data.fromInventoryType === InventoryType.BUILDING && packet.data.toInventoryType === InventoryType.PLAYER) {
    request_move_inventory_item_to_player_inventory(packet, redisPubClient);
  }
}
async function request_move_inventory_item_to_player_inventory(
  packet: NetworkPacketDataWithSender<RequestMoveInventoryItemPacketData>,
  redisPubClient: RedisClientType,
) {
  const building_inventory_item = await WorldBuildingInventory.findOne({
    where: { item: { id: packet.data.item.item.id }, world_building: { id: packet.data.fromInventoryId } },
    relations: ['item', 'world_building'],
  });
  if (!building_inventory_item) {
    log(
      `Building ${packet.data.fromInventoryId} does not have item ${packet.data.item.id} but tried to move it from their inventory! Sus 📮`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // get the building
  const building_to_drop_in = await WorldBuilding.findOne({ where: { id: packet.data.fromInventoryId } });
  if (!building_to_drop_in) {
    log(
      `Building with id ${packet.data.fromInventoryId} not found. Cannot move item to inventory that is non-existant`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // remove / add to inventories

  // Todo: check if player inventory is full
  await WorldBuildingInventory.addToInventory(building_to_drop_in.id, packet.data.item.item.id, -packet.data.item.quantity);
  const quantity_remainder = await UserInventoryItem.addToInventory(packet.packet_sender.id, packet.data.item.item.id, packet.data.item.quantity);

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

async function request_move_inventory_item_to_building(
  packet: NetworkPacketDataWithSender<RequestMoveInventoryItemPacketData>,
  redisPubClient: RedisClientType,
) {
  /* Player wants to put in items into a building */
  // check if the player has the item

  const player_inventory_item = await UserInventoryItem.findOne({
    where: { id: packet.data.item.id, user: { id: packet.packet_sender.id } },
    relations: ['item'],
  });
  if (!player_inventory_item) {
    log(
      `Player ${packet.packet_sender.id} does not have item ${packet.data.item.id} but tried to move it from their inventory! Sus 📮`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }
  // get the building
  const building_to_drop_in = await WorldBuilding.findOne({ where: { id: packet.data.toInventoryId } });
  if (!building_to_drop_in) {
    log(
      `Building with id ${packet.data.toInventoryId} not found. Cannot move item to inventory that is non-existant`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  const quantity_remainder = await WorldBuildingInventory.addToInventory(building_to_drop_in.id, packet.data.item.item.id, packet.data.item.quantity);
  await UserInventoryItem.addToInventory(packet.packet_sender.id, packet.data.item.item.id, -(packet.data.item.quantity - quantity_remainder));

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
