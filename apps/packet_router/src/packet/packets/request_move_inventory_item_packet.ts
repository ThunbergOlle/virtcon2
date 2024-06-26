import { InventoryType, LogApp, LogLevel, log } from '@shared';
import { UserInventoryItem, WorldBuilding, WorldBuildingInventory, safelyMoveItemsBetweenInventories } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestMoveInventoryItemPacketData } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import request_player_inventory_packet from './request_player_inventory_packet';

export default async function request_move_inventory_item_packet(
  packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>,
  redisPubClient: RedisClientType,
) {
  /* Handle differently depending on if items moves between player inventory or building inventory */

  if (packet.data.fromInventoryType === InventoryType.PLAYER && packet.data.toInventoryType === InventoryType.BUILDING) {
    return request_move_inventory_item_to_building(packet, redisPubClient);
  } else if (packet.data.fromInventoryType === InventoryType.BUILDING && packet.data.toInventoryType === InventoryType.PLAYER) {
    return request_move_inventory_item_to_player_inventory(packet, redisPubClient);
  } else if (packet.data.fromInventoryType === InventoryType.PLAYER && packet.data.toInventoryType === InventoryType.PLAYER) {
    return request_move_inventory_item_inside_player_inventory(packet, redisPubClient);
  } else if (packet.data.fromInventoryType === InventoryType.BUILDING && packet.data.toInventoryType === InventoryType.BUILDING) {
    return request_move_inventory_item_inside_building_inventory(packet, redisPubClient);
  }

  log(
    `Cannot move item from ${packet.data.fromInventoryType} to ${packet.data.toInventoryType}. This is not supported!`,
    LogLevel.ERROR,
    LogApp.PACKET_DATA_SERVER,
  );
}
async function request_move_inventory_item_inside_building_inventory(
  packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>,
  redis: RedisClientType,
) {
  await safelyMoveItemsBetweenInventories({
    fromId: packet.data.fromInventoryId,
    toId: packet.data.toInventoryId,
    itemId: packet.data.item.item.id,
    quantity: packet.data.item.quantity,
    fromType: 'building',
    toType: 'building',
    fromSlot: packet.data.fromInventorySlot,
    toSlot: packet.data.toInventorySlot,
  });

  // refreshBuildingCacheAndSendUpdate(packet.data.fromInventoryId, packet.world_id, redis);
}
async function request_move_inventory_item_inside_player_inventory(
  packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>,
  redisPubClient: RedisClientType,
) {
  await safelyMoveItemsBetweenInventories({
    fromId: packet.sender.id,
    toId: packet.sender.id,
    itemId: packet.data.item.item.id,
    quantity: packet.data.item.quantity,
    fromType: 'user',
    toType: 'user',
    fromSlot: packet.data.fromInventorySlot,
    toSlot: packet.data.toInventorySlot,
  });
  request_player_inventory_packet(packet, redisPubClient);
}
async function request_move_inventory_item_to_player_inventory(packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>, redis: RedisClientType) {
  const building_inventory_item = await WorldBuildingInventory.findOne({
    where: { item: { id: packet.data.item.item.id }, world_building: { id: packet.data.fromInventoryId } },
    relations: ['item', 'world_building'],
  });
  if (!building_inventory_item) {
    log(
      `Building ${packet.data.fromInventoryId} does not have item ${packet.data.item} but tried to move it from their inventory! Sus 📮`,
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
  await safelyMoveItemsBetweenInventories({
    fromId: building_to_drop_in.id,
    toId: packet.sender.id,
    itemId: packet.data.item.item.id,
    quantity: packet.data.item.quantity,
    fromType: 'building',
    toType: 'user',
    fromSlot: packet.data.fromInventorySlot,
    toSlot: packet.data.toInventorySlot,
  });

  // send the updated inventory to the player and to the building
  request_player_inventory_packet(packet, redis);

  // refreshBuildingCacheAndSendUpdate(packet.data.fromInventoryId, packet.world_id, redis);
}

async function request_move_inventory_item_to_building(packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>, redis: RedisClientType) {
  /* Player wants to put in items into a building */
  // check if the player has the item

  const player_inventory_item = await UserInventoryItem.findOne({
    where: { slot: packet.data.item.slot, user: { id: packet.sender.id } },
    relations: ['item'],
  });
  if (!player_inventory_item) {
    log(
      `Player ${packet.sender.id} does not have item ${packet.data.item} but tried to move it from their inventory! Sus 📮`,
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

  const quantity_remainder = await WorldBuildingInventory.addToInventory(
    building_to_drop_in.id,
    packet.data.item.item.id,
    packet.data.item.quantity,
    packet.data.toInventorySlot,
  );
  await UserInventoryItem.addToInventory(
    packet.sender.id,
    packet.data.item.item.id,
    -(packet.data.item.quantity - quantity_remainder),
    packet.data.fromInventorySlot,
  );

  // send the updated inventory to the player and to the building
  request_player_inventory_packet(packet, redis);

  // refreshBuildingCacheAndSendUpdate(packet.data.toInventoryId, packet.world_id, redis);
}
