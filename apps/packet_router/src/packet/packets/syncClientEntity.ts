import { ClientPacketWithSender, SyncClientEntityPacket, syncServerEntities } from '@virtcon2/network-packet';

import { log, LogApp, LogLevel } from '@shared';
import { serializeConfig } from '@virtcon2/network-world-entities';
import { RedisClientType } from 'redis';
import { defineDeserializer } from '@virtcon2/bytenetc';

export default async function syncClientEntityPacket(packet: ClientPacketWithSender<SyncClientEntityPacket>, client: RedisClientType) {
  console.log(packet.data);
  const deserialize = defineDeserializer(serializeConfig[packet.data.serializationId]);

  const deserializedEnts = deserialize(packet.world_id, [packet.data.data]);

  log(`Deserialized entities: ${deserializedEnts}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);

  syncServerEntities(client, packet.world_id, packet.world_id, [packet.data.data], packet.data.serializationId);
}
