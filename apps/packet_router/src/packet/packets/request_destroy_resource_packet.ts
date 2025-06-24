import { defineQuery, defineSerializer } from '@virtcon2/bytenetc';
import { ClientPacketWithSender, RequestDestroyResourcePacket } from '@virtcon2/network-packet';
import { createItem, Position, Resource, SerializationID, getSerializeConfig, Player } from '@virtcon2/network-world-entities';
import { clone } from 'ramda';
import { syncServerEntities } from '../enqueue';

export default async function request_destroy_resource_packet(packet: ClientPacketWithSender<RequestDestroyResourcePacket>) {
  const playerQuery = defineQuery(Player, Position);
  const playerEntities = playerQuery(packet.world_id);
  const playerEid = playerEntities.find((eid) => Player(packet.world_id).userId[eid] === packet.sender.id);

  const world = packet.world_id;
  const receivedItemId = Resource(world).itemId[packet.data.resourceEntityId];
  const [resourceX, resourceY] = [Position(world).x[packet.data.resourceEntityId], Position(world).y[packet.data.resourceEntityId]];
  let [x, y] = clone([Position(world).x[playerEid], Position(world).y[playerEid]]);

  x = x + (Math.random() * 16 - 8) * 0.5;
  y = y + (Math.random() * 16 - 8) * 0.5;

  const itemEid = createItem({ world: packet.world_id, itemId: receivedItemId, x, y, droppedFromX: resourceX, droppedFromY: resourceY });
  const serialized = defineSerializer(getSerializeConfig(world)[SerializationID.ITEM])(packet.world_id, [itemEid]);

  await syncServerEntities(packet.world_id, serialized, SerializationID.ITEM);
}
