import { RedisPlayer } from '@shared';

import { RedisClientType } from 'redis';

type SocketID = string;
type WorldID = string;
export interface ServerPacket<T> {
  packet_type: string;
  target: SocketID | WorldID;
  sender: RedisPlayer;
  data: T;
}

export const enqueuePacket = async <T>(client: RedisClientType, worldId: string, packet: ServerPacket<T>) => {
  const packetJson = JSON.stringify(packet);
  await client.rPush(`queue_${worldId}`, packetJson);
};

export const getNextPacket = async (client: RedisClientType, worldId: string) => {
  const packetJson = await client.lPop(`queue_${worldId}`);
  return JSON.parse(packetJson);
};

export const getAllPackets = async (client: RedisClientType, worldId: string): Promise<ServerPacket<unknown>[]> => {
  const packetsJson = await client.lRange(`queue_${worldId}`, 0, -1);
  await client.lTrim(`queue_${worldId}`, packetsJson.length, -1);
  return packetsJson.map((packet) => JSON.parse(packet));
};
