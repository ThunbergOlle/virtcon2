import { DBItem } from '../items/item_type';

export interface DBBuilding {
  id: number;
  item: DBItem;
  item_to_be_placed_on?: DBItem;
  processing_ticks: number;
  width: number;
  height: number;
}
