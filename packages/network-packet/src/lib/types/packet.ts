export enum PacketType {
  JOIN = 'join',
  DISCONNECT = 'disconnect',
  PLAYER_MOVE = 'playerMove',
  LOAD_WORLD = 'loadWorld',
  PLAYER_SET_POSITION = 'playerSetPosition',
}


export interface NetworkPacketData<T> {
  world_id: string;
  packet_type: PacketType;
  data: T;
}

export const UseNetworkPacket = <T>() => ({
  serialize: (packet_type: PacketType, data: T, world_id: string): string => {
    const packetData: NetworkPacketData<T> = {
      packet_type: packet_type,
      data,
      world_id,
    };
    return JSON.stringify(packetData);
  },
  deserialize: (data: string): NetworkPacketData<T> => {
    return JSON.parse(data);
  },
});
