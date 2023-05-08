import { RedisJSONObject } from "./RedisTypes";
import { RedisItem } from "./RedisItem";

export interface ServerInventoryItem extends RedisJSONObject {
    id: number;
    quantity: number;
    item: RedisItem
}
