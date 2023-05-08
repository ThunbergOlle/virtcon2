import { ServerBuilding } from "./RedisBuilding";
import { ServerPlayer } from "./RedisPlayer";
import { RedisJSONObject } from "./RedisTypes";
import { RedisWorldResource } from "./RedisWorldResource";


export interface RedisWorld extends RedisJSONObject {
  players: ServerPlayer[];
  buildings: ServerBuilding[];
  resources: RedisWorldResource[];
  height_map: number[][];
  id: string;
}
