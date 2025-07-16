import { InvalidStateError } from '@shared';
import { defineQuery, defineSerializer } from '@virtcon2/bytenetc';
import { ClientPacketWithSender, RequestDestroyResourcePacket } from '@virtcon2/network-packet';
import { createItem, Position, Resource, SerializationID, getSerializeConfig, Player } from '@virtcon2/network-world-entities';
import { all_db_items } from '@virtcon2/static-game-data';
import { clone } from 'ramda';
import { syncServerEntities } from '../enqueue';

export default async function request_destroy_resource_packet(packet: ClientPacketWithSender<RequestDestroyResourcePacket>) {
  const playerQuery = defineQuery(Player, Position);
  const playerEntities = playerQuery(packet.world_id);
  const playerEid = playerEntities.find((eid) => Player(packet.world_id).userId[eid] === packet.sender.id);

  const world = packet.world_id;
  const resourceEid = packet.data.resourceEntityId;

  const receivedItemId = Resource(world).itemId[resourceEid];
  const item = all_db_items.find((item) => item.id === receivedItemId);

  const { resource } = item || {};
  if (!item || !resource) throw new InvalidStateError(`Item with ID ${receivedItemId} not found in static game data.`);

  const newItemIds = [];

  for (let i = 0; i < resource.dropCount; i++) {
    const [resourceX, resourceY] = [Position(world).x[resourceEid], Position(world).y[resourceEid]];
    let [x, y] = clone([Position(world).x[playerEid], Position(world).y[playerEid]]);

    x = x + (Math.random() * 16 - 8) * 0.5;
    y = y + (Math.random() * 16 - 8) * 0.5;

    newItemIds.push(createItem({ world: packet.world_id, itemId: receivedItemId, x, y, droppedFromX: resourceX, droppedFromY: resourceY }));
  }

  const serialized = defineSerializer(getSerializeConfig(world)[SerializationID.ITEM])(packet.world_id, newItemIds);

  await syncServerEntities(packet.world_id, serialized, SerializationID.ITEM);
}
