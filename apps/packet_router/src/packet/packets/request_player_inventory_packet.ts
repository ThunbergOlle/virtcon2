import { ServerInventoryItem } from '@shared';
import { UserInventoryItem } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, enqueuePacket, PacketType, PlayerInventoryServerPacket, RequestPlayerInventoryPacket } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';

export default async function request_player_inventory_packet(packet: ClientPacketWithSender<RequestPlayerInventoryPacket>, client: RedisClientType) {
  // get player inventory from database.
  const inventory = await UserInventoryItem.find({
    where: { user: { id: packet.sender.id } },
    relations: ['item', 'item.building', 'item.building.items_to_be_placed_on'],
  });
  // send player inventory to client.
  const packet_data: PlayerInventoryServerPacket = {
    player_id: packet.sender.id,
    inventory: inventory as Array<ServerInventoryItem>,
  };

  console.log('Sending player inventory to client:', packet_data);

  return enqueuePacket(client, packet.world_id, {
    packet_type: PacketType.PLAYER_INVENTORY,
    target: packet.sender.socket_id,
    sender: packet.sender,
    data: packet_data,
  });
}
