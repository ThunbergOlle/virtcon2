import { ServerBuilding } from "@shared/types/ServerBuilding";
import { ServerPlayer } from "@shared/types/ServerPlayer";
import { v4 as uuidv4 } from 'uuid';
export class World {
    players: ServerPlayer[] = [];
    buildings: ServerBuilding[] = [];
    name: string;
    id: string;

    constructor(name: string){
        const id = uuidv4();
        this.id = id;
        this.name = name;
    }
    addPlayer(player: ServerPlayer){
        this.players.push(player)
    }
    removePlayer(player: ServerPlayer){
        this.players = this.players.filter(p => p.id !== player.id);
    }
}