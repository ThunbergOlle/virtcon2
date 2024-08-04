import { DBItem } from '../items/item_type';

export interface DBUserInventoryItem {
  userId: number;
  slot: number;
  item?: DBItem;
  itemId?: number;
  quantity: number;
}
