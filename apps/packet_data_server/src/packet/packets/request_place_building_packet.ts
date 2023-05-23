import { LogApp, LogLevel, log } from '@shared';
import { Item, UserInventoryItem, WorldBuilding, WorldResource } from '@virtcon2/database-postgres';
import { NetworkPacketDataWithSender, RequestPlaceBuildingPacketData, RequestPlayerInventoryPacket } from '@virtcon2/network-packet';
import request_player_inventory_packet from './request_player_inventory_packet';
import { RedisClientType } from 'redis';

export default async function request_place_building_packet(packet: NetworkPacketDataWithSender<RequestPlaceBuildingPacketData>, redisPubClient: RedisClientType) {
  // get the sender
  const player_id = packet.packet_sender.id;
  // check if player has the item
  const inventoryItem = await UserInventoryItem.findOne({ where: { user: { id: player_id }, item: { id: packet.data.buildingItemId } } });
  if (!inventoryItem) {
    log(`Player ${player_id} does not have item ${packet.data.buildingItemId}`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }
  const item = await Item.findOne({ where: { id: packet.data.buildingItemId }, relations: ['building', 'building.item_to_be_placed_on'] });
  /* Get if there are any resources at the coordinates. */
  const resource = await WorldResource.findOne({ where: { x: packet.data.x, y: packet.data.y, world: { id: packet.world_id } }, relations: ['item'] });
  /* Check if the item can be placed on the resource */
  if (item.building.item_to_be_placed_on && item.building.item_to_be_placed_on.id !== resource?.item.id) {
    log(`Player ${player_id} tried to place item ${packet.data.buildingItemId} on resource ${resource?.item.id}`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }
  /* Check if position is occupied */
  const occuping_building = await WorldBuilding.findOne({ where: { x: packet.data.x, y: packet.data.y, world: { id: packet.world_id } } });
  if (occuping_building) {
    log(`Player ${player_id} tried to place item ${packet.data.buildingItemId} on occupied position ${packet.data.x}, ${packet.data.y}`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }
  console.log('adding building to world');
  /* Add the building to the database */
  const building = await WorldBuilding.create({
    x: packet.data.x,
    y: packet.data.y,
    building: item.building,
    world_resource: resource,
    world: { id: packet.world_id },
  });
  await building.save()
  resource.world_building = building;
  await resource.save();

  /* Remove the item from players inventory */
  await UserInventoryItem.addToInventory(player_id, packet.data.buildingItemId, -1);
  /* Send the new inventory to the player */
  request_player_inventory_packet(
    {
      ...packet,
      data: {},
    } as NetworkPacketDataWithSender<RequestPlayerInventoryPacket>,
    redisPubClient,
  );
}
