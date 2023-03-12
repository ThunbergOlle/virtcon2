import { createClient } from "redis";

export class Redis {
  public client: ReturnType<typeof createClient>;

  constructor() {
    const client = createClient();
    this.client = client;
    client.on("error", (err) => console.log("Redis Client Error", err));

  }
  async connectClient() {
    await this.client.connect();
    console.log("Redis database connected")
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
  async setJson(key: string, path: string,  value: any) {
    await this.client.json.set(key, path, value);
  }
}
