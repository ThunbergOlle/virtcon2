import { DBItem } from '../items/item_type';

export interface DBBuilding {
  name: string;
  id: number;
  item: DBItem;
  is_rotatable?: boolean;
  item_to_be_placed_on?: DBItem;
  output_item: DBItem | null;
  output_quantity: number | null;
  processing_ticks: number;
  inventory_transfer_quantity_per_cycle?: number;
  width: number;
  height: number;
}
