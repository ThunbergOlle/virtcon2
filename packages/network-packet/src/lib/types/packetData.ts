import { SerializedData } from '@virtcon2/bytenetc';
import { SerializationID } from '@virtcon2/network-world-entities';
import { DBItem } from '@virtcon2/static-game-data';

export type ServerInventoryItem = {
  quantity: number;
  slot: number;
  item: DBItem | null;
};

export enum InventoryType {
  PLAYER = 'PLAYER',
  BUILDING = 'BUILDING',
}

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
  seed: number;
}

export interface RequestDestroyResourcePacket {
  resourceEntityId: number;
}

export interface RequestDestroyHarvestablePacket {
  harvestableEntityId: number;
}

export interface RequestPickupItemPacketData {
  itemEntityId: number;
}

export interface RequestPlaceBuildingPacketData {
  buildingItemId: number;
  rotation: number;
  x: number;
  y: number;
}

export interface RequestMoveInventoryItemPacketData {
  fromInventoryType: InventoryType;
  fromInventorySlot: number;
  fromInventoryId: number;
  toInventoryType: InventoryType;
  toInventoryId: number;
  toInventorySlot: number;
  inventoryItem: ServerInventoryItem;
}

export interface RequestPlaceHarvestablePacketData {
  itemId: number;
  x: number;
  y: number;
}

export interface RequestPickupBuildingPacketData {
  worldBuildingId: number;
}
