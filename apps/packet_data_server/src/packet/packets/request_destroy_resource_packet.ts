import { LogApp, LogLevel, log } from '@shared';
import { User, UserInventoryItem, WorldResource } from '@virtcon2/database-postgres';
import { NetworkPacketDataWithSender, RequestDestroyResourcePacket } from '@virtcon2/network-packet';

export default async function request_destroy_resource_packet(packet: NetworkPacketDataWithSender<RequestDestroyResourcePacket>) {
  // get resource from the database
  const resource = await WorldResource.findOne({ where: { id: packet.data.resourceId }, relations: ['item'] });
  if (!resource) {
    return;
  }
  // get the item
  const received_item = resource.item;

  // add the item to the players inventory
  const player_id = packet.packet_sender.id;
  const player = await User.findOne({ where: { id: player_id } });
  if (!player) {
    log(`Player ${player_id} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }
  UserInventoryItem.addToInventory(player_id, received_item.id, 1);
}
