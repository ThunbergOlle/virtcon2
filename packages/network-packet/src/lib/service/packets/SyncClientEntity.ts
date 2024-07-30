import { SerializedData } from '@virtcon2/bytenetc';
import { SerializationID } from '@virtcon2/network-world-entities';

export type SyncClientEntityPacket = {
  serializationId: SerializationID;
  data: SerializedData;
};
