import { v4 as uuidv4 } from "uuid";
import { ItemType } from "../item";
export class ServerPlayer {
  id: string;
  name: string;
  pos: { x: number; y: number, updated: number } = { x: 0, y: 0, updated: 0 };
  inventory: {type: ItemType}[] = [];
  socket: string;
  worldId: string;
  constructor(name: string, worldId: string,  socket: string) {
    console.log("Adding player with socket id", socket);
    this.name = name;
    this.id = uuidv4();
    this.socket = socket;
    this.worldId = worldId;
  }

}
