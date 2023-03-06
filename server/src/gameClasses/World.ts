import { ServerPlayer } from "@shared/types/ServerPlayer";
import { v4 as uuidv4 } from 'uuid';
export class World {
    players: ServerPlayer[] = [];
    name: string;
    id: string;

    constructor(name: string){
        const id = uuidv4();
        this.name = name;
    }
    addPlayer(player: ServerPlayer){
        this.players.push(player)
    }
}