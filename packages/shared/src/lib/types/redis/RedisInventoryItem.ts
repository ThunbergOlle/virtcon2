import { RedisJSONObject } from "./RedisTypes";
import { ServerItem } from "./RedisItem";

export interface ServerInventoryItem extends RedisJSONObject {
    id: number;
    quantity: number;
    item: ServerItem
}
