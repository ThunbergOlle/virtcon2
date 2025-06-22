import { Entity, SerializedData } from '@virtcon2/bytenetc';
import { SerializationID } from '@virtcon2/network-world-entities';

export type WorldBounds = {
  x: number;
  y: number;
};

export type WorldData = {
  bounds: WorldBounds[];
};

export type SyncEntities = {
  worldData: WorldData;
  removeEntities: Entity[];
  sync: {
    data: SerializedData[];
    serializationId: SerializationID;
  }[];
};
