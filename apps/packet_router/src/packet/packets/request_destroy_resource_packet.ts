import { defineSerializer } from '@virtcon2/bytenetc';
import { ClientPacketWithSender, RequestDestroyResourcePacket, syncServerEntities } from '@virtcon2/network-packet';
import { createItem, Position, Resource, SerializationID, serializeConfig } from '@virtcon2/network-world-entities';
import { redisClient } from '../../redis';

export default async function request_destroy_resource_packet(packet: ClientPacketWithSender<RequestDestroyResourcePacket>) {
  const receivedItemId = Resource.itemId[packet.data.resourceEntityId];
  let [x, y] = [Position.x[packet.data.resourceEntityId], Position.y[packet.data.resourceEntityId]];

  x = x + (Math.floor(Math.random() * 8) + 8) * (Math.random() < 0.5 ? -1 : 1);
  y = y + Math.floor(Math.random() * 8);

  const itemEid = createItem({ world: packet.world_id, itemId: receivedItemId, x, y });
  const serialized = defineSerializer(serializeConfig[SerializationID.ITEM])(packet.world_id, [itemEid]);

  syncServerEntities(redisClient, packet.world_id, packet.world_id, serialized, SerializationID.ITEM);
}
