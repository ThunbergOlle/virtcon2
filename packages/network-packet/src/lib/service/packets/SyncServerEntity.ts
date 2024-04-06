import { SerializationID } from '@virtcon2/network-world-entities';

export type SyncServerEntityPacket = {
  serializationId: SerializationID;
  buffer: ArrayBuffer;
};
