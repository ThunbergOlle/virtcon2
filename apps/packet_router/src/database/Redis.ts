import { LogApp, LogLevel, log } from '@shared';
import { createClient } from 'redis';

export class Redis {
  public client: ReturnType<typeof createClient>;

  constructor() {
    const client = createClient();
    this.client = client;
    client.on('error', (err) => console.log('Redis Client Error', err));
  }
  async connectClient() {
    await this.client.connect();
    log('Redis database connected', LogLevel.OK, LogApp.SERVER);
  }
  async set(key: string, value: string) {
    await this.client.set(key, value);
  }
  async get(key: string) {
    const value = await this.client.get(key);
    return value;
  }
  async disconnect() {
    await this.client.disconnect();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setJson(key: string, path: string, value: any) {
    await this.client.json.set(key, path, value);
  }
}
/* Use Builder pattern */
export class RedisPublisher {
  public client: ReturnType<typeof createClient>;
  private _channel = '';
  private _packet_type = '';
  private _target = 'all';
  private _data = '';
  private _packet: string;
  constructor(client: ReturnType<typeof createClient>) {
    this.client = client;
  }
  channel(channel: string) {
    this._channel = channel;
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
    if (!this._channel || !this._packet_type || !this._data) {
      throw new Error('Packet not correctly built');
    }
    this._packet = this._packet_type + '#' + this._target + '#' + this._data;
    return this;
  }
  async publish() {
    if (!this._packet) {
      throw new Error('Packet not built');
    }
    await this.client.publish(this._channel, this._packet);
  }
}
