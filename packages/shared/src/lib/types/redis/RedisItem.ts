import { RedisJSONObject } from './RedisTypes';

export interface RedisItem extends RedisJSONObject {
  id: number;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  type: string;
  rarity: string;
}
