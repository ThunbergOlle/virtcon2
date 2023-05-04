export enum PacketType {
  JOIN = 'join',
  DISCONNECT = 'disconnect',
  PLAYER_MOVE = 'playerMove',
  LOAD_WORLD = 'loadWorld',
  PLAYER_SET_POSITION = 'playerSetPosition',
  REQUEST_PLAYER_INVENTORY = 'requestPlayerInventory',
}

export interface NetworkPacketData<T> {
  world_id: string;
  packet_type: PacketType;
  packet_target?: string;
  data: T;
}

