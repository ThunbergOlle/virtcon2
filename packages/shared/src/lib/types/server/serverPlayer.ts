import { v4 as uuidv4 } from 'uuid';
import { ItemType } from '../item';
export class ServerPlayer {
  id: string;
  name: string;
  pos: { x: number; y: number; updated: number } = { x: 0, y: 0, updated: 0 };
  inventory: { type: ItemType }[] = [];
  world_id: string;
  constructor(name: string, world_id: string) {
    this.name = name;
    this.id = uuidv4();
    this.world_id = world_id;
  }
}
