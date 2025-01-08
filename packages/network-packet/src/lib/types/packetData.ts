import { RedisWorldBuilding } from '@shared';
import { SerializedData } from '@virtcon2/bytenetc';
import { SerializationID } from '@virtcon2/network-world-entities';
import { InventoryType, ServerInventoryItem } from '@shared';

export type SyncClientEntityPacket = {
  serializationId: SerializationID;
  data: SerializedData;
};

export type SyncServerEntityPacket = {
  serializationId: SerializationID;
  data: SerializedData[];
};

export interface RemoveEntityPacket {
  entityIds: number[];
}

export interface RequestJoinPacketData {
  socket_id: string;
  token: string;
}

export interface JoinPacketData {
  id: string;
  name: string;
  position: number[];
  socket_id: string;
}

export interface DisconnectPacketData {
  eid: number;
}

export interface InspectBuildingClientPacket {
  worldBuildingId: number;
}

export interface CreateConnectionPointPacket {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface LoadWorldPacketData {
  id: string;
  mainPlayerId: number;
}

export interface RequestDestroyResourcePacket {
  resourceEntityId: number;
}

export interface RequestPlaceBuildingPacketData {
  buildingItemId: number;
  rotation: number;
  x: number;
  y: number;
}

export type PlaceBuildingPacket = RedisWorldBuilding;

export interface RequestMoveInventoryItemPacketData {
  fromInventoryType: InventoryType;
  fromInventorySlot: number;
  fromInventoryId: number;
  toInventoryType: InventoryType;
  toInventoryId: number;
  toInventorySlot: number;
  inventoryItem: ServerInventoryItem;
}
