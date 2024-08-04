import { World } from '@virtcon2/bytenetc';

export enum PacketType {
  JOIN = 'join',
  DISCONNECT = 'disconnect',
  PLAYER_MOVE = 'playerMove',
  LOAD_WORLD = 'loadWorld',
  PLAYER_SET_POSITION = 'playerSetPosition',
  PLAYER_INVENTORY = 'playerInventory',
  REQUEST_JOIN = 'requestJoin',
  REQUEST_DESTROY_RESOURCE = 'requestDestroyResource',
  REQUEST_PLACE_BUILDING = 'requestPlaceBuilding',
  REQUEST_MOVE_INVENTORY_ITEM = 'requestMoveInventoryItem',
  REQUEST_WORLD_BUILDING_CHANGE_OUTPUT = 'requestWorldBuildingChangeOutput',
  INTERNAL_WORLD_BUILDING_FINISHED_PROCESSING = 'internalWorldBuildingFinishedProcessing',
  WORLD_BUILDING = 'worldBuilding',

  SYNC_CLIENT_ENTITY = 'syncClientEntity',
  SYNC_SERVER_ENTITY = 'syncServerEntity',
}

export interface PacketSender {
  id: number;
  name: string;
  socket_id: string;
  world_id: string;
}

type SocketID = string;
type WorldID = string;
export interface ServerPacket<T> {
  packet_type: string;
  target: SocketID | WorldID;
  sender: PacketSender;
  data: T;
}

export interface ClientPacket<T> {
  world_id?: string;
  packet_type: PacketType;
  packet_target?: string;
  data: T;
}
export interface ClientPacketWithSender<T> extends ServerPacket<T> {
  sender: PacketSender;
  world_id: World;
}
