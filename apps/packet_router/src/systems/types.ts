import { Entity, SerializedData } from '@virtcon2/bytenetc';
import { SerializationID } from '@virtcon2/network-world-entities';

export type SyncEntities = {
  removeEntities: Entity[];
  sync: {
    data: SerializedData[];
    serializationId: SerializationID;
  }[];
};
