import { defineSerializer } from '@virtcon2/bytenetc';
import { ClientPacketWithSender, RequestDestroyResourcePacket } from '@virtcon2/network-packet';
import { createItem, Position, Resource, SerializationID, serializeConfig } from '@virtcon2/network-world-entities';
import { clone } from 'ramda';
import { syncServerEntities } from '../enqueue';

export default async function request_destroy_resource_packet(packet: ClientPacketWithSender<RequestDestroyResourcePacket>) {
  const receivedItemId = Resource.itemId[packet.data.resourceEntityId];
  const [resourceX, resourceY] = [Position.x[packet.data.resourceEntityId], Position.y[packet.data.resourceEntityId]];
  let [x, y] = clone([resourceX, resourceY]);

  x = x + (Math.floor(Math.random() * 16) + 8) * (Math.random() < 0.5 ? -1 : 1);
  y = y + Math.floor(Math.random() * 16);

  const itemEid = createItem({ world: packet.world_id, itemId: receivedItemId, x, y, droppedFromX: resourceX, droppedFromY: resourceY });
  const serialized = defineSerializer(serializeConfig[SerializationID.ITEM])(packet.world_id, [itemEid]);

  await syncServerEntities(packet.world_id, serialized, SerializationID.ITEM);
}
