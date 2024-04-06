import { ClientPacketWithSender, SyncClientEntityPacket, syncServerEntities } from '@virtcon2/network-packet';

import { log, LogApp, LogLevel } from '@shared';
import { serializeConfig } from '@virtcon2/network-world-entities';
import { defineDeserializer } from 'bitecs';
import { RedisClientType } from 'redis';
import { getEntityWorld } from '../../ecs/entityWorld';

export default async function syncClientEntityPacket(packet: ClientPacketWithSender<SyncClientEntityPacket>, client: RedisClientType) {
  const buffer = packet.data.buffer;
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  view.set(buffer);

  const entityWorld = getEntityWorld(packet.world_id);

  console.log(`Deserializing entities: ${packet.data.serializationId}`);
  console.log(packet.data.buffer);

  const deserialize = defineDeserializer(serializeConfig[packet.data.serializationId]);

  // @ts-ignore - Changed is a bitecs function
  const deserializedEnts = deserialize(entityWorld, arrayBuffer);

  log(`Deserialized entities: ${deserializedEnts}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);

  syncServerEntities(client, packet.world_id, packet.world_id, arrayBuffer, packet.data.serializationId);
}
