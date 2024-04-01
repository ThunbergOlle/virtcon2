import { RedisPlayer } from '@shared';

export enum PacketType {
  JOIN = 'join',
  DISCONNECT = 'disconnect',
  PLAYER_MOVE = 'playerMove',
  LOAD_WORLD = 'loadWorld',
  PLAYER_SET_POSITION = 'playerSetPosition',
  REQUEST_PLAYER_INVENTORY = 'requestPlayerInventory',
  PLAYER_INVENTORY = 'playerInventory',
  REQUEST_JOIN = 'requestJoin',
  REQUEST_DESTROY_RESOURCE = 'requestDestroyResource',
  REQUEST_PLACE_BUILDING = 'requestPlaceBuilding',
  INSPECT_WORLD_BUILDING = 'inspectWorldBuilding',
  DONE_INSPECTING_WORLD_BUILDING = 'doneInspectingWorldBuilding',
  REQUEST_MOVE_INVENTORY_ITEM = 'requestMoveInventoryItem',
  REQUEST_WORLD_BUILDING_CHANGE_OUTPUT = 'requestWorldBuildingChangeOutput',
  INTERNAL_WORLD_BUILDING_FINISHED_PROCESSING = 'internalWorldBuildingFinishedProcessing',
  WORLD_BUILDING = 'worldBuilding',
  PLACE_BUILDING = 'placeBuilding',

  /* BitECS entities */
  SYNC_CLIENT_ENTITY = 'syncClientEntity',
  SYNC_SERVER_ENTITY = 'syncServerEntity',
}

type SocketID = string;
type WorldID = string;
export interface ServerPacket<T> {
  packet_type: string;
  target: SocketID | WorldID;
  sender: RedisPlayer;
  data: T;
}

export interface ClientPacket<T> {
  world_id?: string;
  packet_type: PacketType;
  packet_target?: string;
  data: T;
}
export interface ClientPacketWithSender<T> extends ServerPacket<T> {
  sender: RedisPlayer;
  world_id: string;
}
