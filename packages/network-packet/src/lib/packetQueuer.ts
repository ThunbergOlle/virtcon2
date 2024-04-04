import { log } from '@shared';
import { RedisClientType } from 'redis';
import { PacketType, ServerPacket } from './types/packet';

export const enqueuePacket = async <T>(client: RedisClientType, worldId: string, packet: ServerPacket<T>) => {
  if (packet.data instanceof ArrayBuffer) {
    log(`Buffer length: ${packet.data.byteLength}`);
    const dataView = new DataView(packet.data);
    const buffer = Buffer.from(dataView.buffer, dataView.byteOffset, dataView.byteLength);

    console.log(buffer.toJSON());
    await client.rPush(
      `queue_${worldId}`,
      JSON.stringify({
        ...packet,
        data: buffer.toJSON(),
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

const parsePacket = (packet: string): ServerPacket<unknown> => {
  return JSON.parse(packet);
};

export const syncServerEntities = async (client: RedisClientType, queue: string, target: string, data: ArrayBuffer) => {
  await enqueuePacket(client, queue, {
    packet_type: PacketType.SYNC_SERVER_ENTITY,
    target: target,
    data,
    sender: {
      id: -1,
      name: 'server_syncer',
      socket_id: '',
      world_id: '',
    },
  });
};
