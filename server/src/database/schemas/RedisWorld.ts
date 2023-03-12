import { ServerBuilding } from "@shared/types/ServerBuilding";
import { ServerPlayer } from "@shared/types/ServerPlayer";

export interface RedisWorld {
    players: ServerPlayer[];
    buildings: ServerBuilding[];
    name: string;
    id: string;
}