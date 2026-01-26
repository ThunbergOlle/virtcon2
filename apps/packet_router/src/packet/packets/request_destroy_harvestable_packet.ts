import { InvalidStateError } from '@shared';
import { defineQuery, defineSerializer, removeEntity } from '@virtcon2/bytenetc';
import { ClientPacketWithSender, RequestDestroyHarvestablePacket } from '@virtcon2/network-packet';
import { createItem, Position, Harvestable, SerializationID, getSerializeConfig, Player } from '@virtcon2/network-world-entities';
import { all_db_items } from '@virtcon2/static-game-data';
import { clone } from 'ramda';
import { syncServerEntities, syncRemoveEntities } from '../enqueue';

export default async function request_destroy_harvestable_packet(packet: ClientPacketWithSender<RequestDestroyHarvestablePacket>) {
  const playerQuery = defineQuery(Player, Position);
  const playerEntities = playerQuery(packet.world_id);
  const playerEid = playerEntities.find((eid) => Player(packet.world_id).userId[eid] === packet.sender.id);

  const world = packet.world_id;
  const harvestableEid = packet.data.harvestableEntityId;

  const receivedItemId = Harvestable(world).itemId[harvestableEid];
  const dropCount = Harvestable(world).dropCount[harvestableEid];
  const item = all_db_items.find((item) => item.id === receivedItemId);

  if (!item) throw new InvalidStateError(`Item with ID ${receivedItemId} not found in static game data.`);

  const newItemIds = [];

  for (let i = 0; i < dropCount; i++) {
    const [harvestableX, harvestableY] = [Position(world).x[harvestableEid], Position(world).y[harvestableEid]];
    let [x, y] = clone([Position(world).x[playerEid], Position(world).y[playerEid]]);

    x = x + (Math.random() * 16 - 8) * 0.5;
    y = y + (Math.random() * 16 - 8) * 0.5;

    newItemIds.push(createItem({ world: packet.world_id, itemId: receivedItemId, x, y, droppedFromX: harvestableX, droppedFromY: harvestableY }));
  }

  const itemSerialized = defineSerializer(getSerializeConfig(world)[SerializationID.ITEM])(packet.world_id, newItemIds);

  // Remove the harvestable entity
  removeEntity(world, harvestableEid);

  await syncServerEntities(packet.world_id, itemSerialized, SerializationID.ITEM);
  await syncRemoveEntities(packet.world_id, [harvestableEid]);
}
