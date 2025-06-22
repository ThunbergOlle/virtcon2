import { LogApp, LogLevel, log } from '@shared';
import { removeEntity } from '@virtcon2/bytenetc';
import { AppDataSource, publishUserInventoryUpdate, User, UserInventoryItem } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestPickupItemPacketData } from '@virtcon2/network-packet';
import { Item } from '@virtcon2/network-world-entities';
import { syncRemoveEntities } from '../enqueue';

export default async function requestPickupItemPacket(packet: ClientPacketWithSender<RequestPickupItemPacketData>) {
  const receivedItemId = Item(packet.sender.world_id).itemId[packet.data.itemEntityId];

  await syncRemoveEntities(packet.sender.world_id, [removeEntity(packet.sender.world_id, packet.data.itemEntityId)]);

  const player_id = packet.sender.id;
  const player = await User.findOne({ where: { id: player_id } });
  if (!player) {
    log(`Player ${player_id} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  await AppDataSource.transaction(async (transaction) => UserInventoryItem.addToInventory(transaction, player_id, receivedItemId, 1));
  await publishUserInventoryUpdate(player_id);
}
