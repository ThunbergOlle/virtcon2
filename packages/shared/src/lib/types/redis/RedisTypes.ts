export type RedisJSON = null | boolean | number | string | Date | RedisJSONArray | RedisJSONObject;
export type RedisJSONArray = Array<RedisJSON>;
export interface RedisJSONObject {
  [key: string]: RedisJSON;
  [key: number]: RedisJSON;
}

export const asRedisItem = <T>(item: unknown): T => {
  return item as T;
};
