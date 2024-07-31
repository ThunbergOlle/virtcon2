import { SerializedData } from '@virtcon2/bytenetc';
import { SerializationID } from '@virtcon2/network-world-entities';
import { RedisClientType } from 'redis';
import { SyncServerEntityPacket } from './service/packets/SyncServerEntity';
import { PacketType, ServerPacket } from './types/packet';

export const enqueuePacket = async <T>(client: RedisClientType, worldId: string, packet: ServerPacket<T>) => {
  if (packet.packet_type === PacketType.SYNC_SERVER_ENTITY) {
    const data = packet.data as SyncServerEntityPacket;

    await client.rPush(
      `queue_${worldId}`,
      JSON.stringify({
        ...packet,
        // TODO: figure out a way to deal with Uint8Array
        data,
      }),
    );
  } else if (typeof packet === 'object') await client.rPush(`queue_${worldId}`, JSON.stringify(packet));
  else await client.rPush(`queue_${worldId}`, packet);
};

export const getNextPacket = async (client: RedisClientType, worldId: string) => {
  const packetJson = await client.lPop(`queue_${worldId}`);
  return JSON.parse(packetJson);
};

export const getAllPackets = async (client: RedisClientType, worldId: string): Promise<ServerPacket<unknown>[]> => {
  const packets = await client.lRange(`queue_${worldId}`, 0, -1);
  await client.lTrim(`queue_${worldId}`, packets.length, -1);
  return packets.map(parsePacket);
};

const parsePacket = (packet: string): ServerPacket<unknown> => JSON.parse(packet);

export const syncServerEntities = async (client: RedisClientType, queue: string, target: string, data: SerializedData[], serializationId: SerializationID) => {
  await enqueuePacket<SyncServerEntityPacket>(client, queue, {
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
