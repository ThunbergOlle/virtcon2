import { DBItem } from "../items/item_type";

export interface DBItemRecipe {
  id: number;
  requiredItem: DBItem;
  requiredQuantity: number;
  resultingItem: DBItem;
}
