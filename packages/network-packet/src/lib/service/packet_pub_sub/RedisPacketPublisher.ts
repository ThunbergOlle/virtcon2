import { ServerPlayer } from '@shared';
import { RedisClientType } from 'redis';

/* Use Builder pattern */
export class RedisPacketPublisher {
  public client: RedisClientType;
  static channel_prefix = 'router_';
  private _channel = '';
  private _packet_type = '';
  private _target = 'all';
  private _sender: ServerPlayer = { id: '', name: '', inventory: [], position: [0, 0], socket_id: '', world_id: '' };
  private _data = '';
  private _packet: string;
  constructor(client: RedisClientType) {
    this.client = client;
  }
  sender(sender: ServerPlayer) {
    if (!sender) return this;
    this._sender = sender;
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
      throw new Error('Packet not correctly built, missing data: ' + JSON.stringify({ channel: this._channel, packet_type: this._packet_type, data: this._data, sender: this._sender }));
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
