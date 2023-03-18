import { ServerBuilding } from "../../types/ServerBuilding";
import { ServerPlayer } from "../../types/ServerPlayer";

export interface RedisWorld {
    players: ServerPlayer[];
    buildings: ServerBuilding[];
    name: string;
    id: string;
}
