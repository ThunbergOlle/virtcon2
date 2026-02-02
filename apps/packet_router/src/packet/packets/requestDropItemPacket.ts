import { InvalidStateError, log, LogApp, LogLevel } from '@shared';
import { defineQuery, defineSerializer } from '@virtcon2/bytenetc';
import { AppDataSource, publishUserInventoryUpdate, User, UserInventoryItem } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestDropItemPacketData } from '@virtcon2/network-packet';
import { createItem, getSerializeConfig, Player, Position, SerializationID } from '@virtcon2/network-world-entities';
import { syncServerEntities } from '../enqueue';
import { inventoryQueue } from '../inventoryQueue';

export default async function requestDropItemPacket(packet: ClientPacketWithSender<RequestDropItemPacketData>) {
  const world = packet.world_id;
  const { itemId, inventorySlot, x, y, quantity } = packet.data;

  if (quantity <= 0) {
    throw new InvalidStateError('Cannot drop zero or negative quantity');
  }

  const playerQuery = defineQuery(Player, Position);
  const playerEntities = playerQuery(world);
  const playerEid = playerEntities.find((eid) => Player(world).userId[eid] === packet.sender.id);

  if (playerEid === undefined) {
    log(`Player entity not found for user ${packet.sender.id}`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  const playerId = packet.sender.id;
  const player = await User.findOne({ where: { id: playerId } });
  if (!player) {
    log(`Player ${playerId} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  const inventoryItem = await UserInventoryItem.findOne({
    where: { userId: playerId, slot: inventorySlot },
    relations: ['item'],
  });

  if (!inventoryItem || inventoryItem.itemId !== itemId || inventoryItem.quantity < quantity) {
    log(`Invalid inventory state for drop: slot=${inventorySlot}, expected item=${itemId}`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  const playerX = Position(world).x[playerEid];
  const playerY = Position(world).y[playerEid];

  await inventoryQueue.add(async () => {
    await AppDataSource.transaction(async (transaction) => UserInventoryItem.addToInventory(transaction, playerId, itemId, -quantity, inventorySlot));
    await publishUserInventoryUpdate(playerId);
  });

  const newItemEid = createItem({
    world,
    itemId,
    x,
    y,
    droppedFromX: playerX,
    droppedFromY: playerY,
  });

  const itemSerialized = defineSerializer(getSerializeConfig(world)[SerializationID.ITEM])(world, [newItemEid]);
  await syncServerEntities(world, itemSerialized, SerializationID.ITEM);
}
