import { LogApp, LogLevel, log } from "@shared";
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
    log("Redis database connected", LogLevel.OK, LogApp.SERVER);
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
  async setJson(key: string, path: string,  value: any) {
    await this.client.json.set(key, path, value);
  }
}
