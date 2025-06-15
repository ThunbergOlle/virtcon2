import { log, LogApp, LogLevel } from '@shared';
import { defineDeserializer, SerializedData } from '@virtcon2/bytenetc';
import {
  ClientPacketWithSender,
  PacketType,
  RemoveEntityPacket,
  ServerPacket,
  SyncClientEntityPacket,
  SyncServerEntityPacket,
} from '@virtcon2/network-packet';
import { SerializationID, serializeConfig } from '@virtcon2/network-world-entities';
import { io } from '../app';

export const enqueuePacket = async <T>(packet: ServerPacket<T>) => {
  io.sockets.to(packet.target).emit('packets', [packet]);
};

export const syncServerEntities = async (target: string, data: SerializedData[], serializationId: SerializationID) => {
  if (!data.length) return;
  await enqueuePacket<SyncServerEntityPacket>({
    packet_type: PacketType.SYNC_SERVER_ENTITY,
    target: target,
    data: {
      serializationId,
      data,
    },
    sender: {
      id: -1,
      name: 'server_syncer',
      socket_id: '',
      world_id: '',
    },
  });
};

export const syncRemoveEntities = async (target: string, eids: number[]) => {
  if (!eids.length) return;
  await enqueuePacket<RemoveEntityPacket>({
    packet_type: PacketType.REMOVE_ENTITY,
    target: target,
    data: {
      entityIds: eids,
    },
    sender: {
      id: -1,
      name: 'server_syncer',
      socket_id: '',
      world_id: '',
    },
  });
};

export default async function syncClientEntityPacket(packet: ClientPacketWithSender<SyncClientEntityPacket>) {
  const deserialize = defineDeserializer(serializeConfig[packet.data.serializationId]);

  const deserializedEnts = deserialize(packet.world_id, [packet.data.data]);

  log(`Deserialized entities: ${deserializedEnts}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);

  await syncServerEntities(packet.world_id, [packet.data.data], packet.data.serializationId);
}
