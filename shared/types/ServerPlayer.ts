import { Item } from "../../server/src/gameClasses/Item";
import { v4 as uuidv4 } from "uuid";
export class ServerPlayer {
    id: string;
    name: string;
    pos: { x: number; y: number } = { x: 0, y: 0 };
    inventory: Item[] = [];
    constructor( name: string) {
        this.name = name;
        this.id = uuidv4();
    }
}