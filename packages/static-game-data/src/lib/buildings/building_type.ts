import { DBItem } from '../items/item_type';

export interface DBBuilding {
  name: string;
  id: number;
  item: DBItem;
  item_to_be_placed_on?: DBItem;
  processing_ticks: number;
  width: number;
  height: number;
}
