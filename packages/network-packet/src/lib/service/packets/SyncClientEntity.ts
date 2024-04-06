import { SerializationID } from '@virtcon2/network-world-entities';

export type SyncClientEntityPacket = {
  serializationId: SerializationID;
  buffer: Buffer;
};
