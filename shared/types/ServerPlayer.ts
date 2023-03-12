import { Item } from "../../server/src/gameClasses/Item";
import { v4 as uuidv4 } from "uuid";
import * as socketio from "socket.io";
export class ServerPlayer {
  id: string;
  name: string;
  pos: { x: number; y: number } = { x: 0, y: 0 };
  inventory: Item[] = [];
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
