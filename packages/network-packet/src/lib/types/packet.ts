export enum PacketType {
    JOIN = 'join',
    PLAYER_MOVE = 'join',
    PLAYER_SET_POSITION = 'playerSetPosition',
}
export abstract class NetworkPacket {

  type: PacketType;


  constructor(type: PacketType) {
    this.type = type;
  }

  abstract serialize(data: unknown): string;
  abstract deserialize(data: string): unknown;

}
