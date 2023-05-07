import { ServerBuilding } from "./RedisBuilding";
import { ServerPlayer } from "./RedisPlayer";
import { RedisJSONObject } from "./RedisTypes";


export interface RedisWorld extends RedisJSONObject {
  players: ServerPlayer[];
  buildings: ServerBuilding[];
  id: string;
}
