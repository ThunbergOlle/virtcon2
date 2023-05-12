import { ServerPlayer } from '@shared';
import { RedisClientType } from 'redis';

/* Use Builder pattern */
export class RedisPacketPublisher {
  public client: RedisClientType;
  static channel_prefix = 'router_';
  private _channel = '';
  private _packet_type = '';
  private _target = 'all';
  private _sender: ServerPlayer;
  private _data = '';
  private _packet: string;
  constructor(client: RedisClientType) {
    this.client = client;
  }
  sender(sender: ServerPlayer | null) {
    this._sender = sender ?? { id: '', name: '', inventory: [], position: [0, 0], socket_id: '', world_id: '' };
    return this;
  }
  channel(channel: string) {
    this._channel = RedisPacketPublisher.channel_prefix + channel;
    return this;
  }
  packet_type(packet_type: string) {
    this._packet_type = packet_type;
    return this;
  }
  target(target?: string) {
    this._target = target ?? 'all';
    return this;
  }
  data(data: unknown) {
    this._data = JSON.stringify(data);
    return this;
  }
  build() {
    if (!this._channel || !this._packet_type || !this._data || !this._sender) {
      throw new Error('Packet not correctly built');
    }

    this._packet = this._packet_type + '#' + this._target + '#' + JSON.stringify(this._sender) + '#' + this._data;
    return this;
  }
  async publish() {
    if (!this._packet) {
      throw new Error('Packet not built');
    }
    await this.client.publish(this._channel, this._packet);
  }
}
