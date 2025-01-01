import { LogApp, LogLevel, log } from '@shared';
import { AppDataSource, publishUserInventoryUpdate, User, UserInventoryItem } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestDestroyResourcePacket } from '@virtcon2/network-packet';
import { Resource } from '@virtcon2/network-world-entities';

export default async function request_destroy_resource_packet(packet: ClientPacketWithSender<RequestDestroyResourcePacket>) {
  const receivedItemId = Resource.itemId[packet.data.resourceEntityId];

  const player_id = packet.sender.id;
  const player = await User.findOne({ where: { id: player_id } });
  if (!player) {
    log(`Player ${player_id} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  await AppDataSource.transaction(async (transaction) => UserInventoryItem.addToInventory(transaction, player_id, receivedItemId, 1));
  await publishUserInventoryUpdate(player_id);
}
