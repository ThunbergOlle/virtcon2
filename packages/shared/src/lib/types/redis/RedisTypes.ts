// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RedisJSON = null | boolean | number | string | Date | RedisJSONArray | RedisJSONObject;
type RedisJSONArray = Array<RedisJSON>;
interface RedisJSONObject {
  [key: string]: RedisJSON;
  [key: number]: RedisJSON;
}

export const asRedisItem = (item: unknown) => {
  return item as unknown as RedisJSONObject;
};
export const asRedisItemArray = (item: unknown) => {
  return item as unknown as RedisJSONObject[];
};
