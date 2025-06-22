import { Entity, SerializedData } from '@virtcon2/bytenetc';
import { SerializationID } from '@virtcon2/network-world-entities';

export type WorldData = {
  bounds: {
    startX: number;
    endX: number;
    startY: number;
    endY: number;
  };
};

export type SyncEntities = {
  worldData: WorldData;
  removeEntities: Entity[];
  sync: {
    data: SerializedData[];
    serializationId: SerializationID;
  }[];
};
