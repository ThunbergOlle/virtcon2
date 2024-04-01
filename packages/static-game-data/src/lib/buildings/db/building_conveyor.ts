import item_conveyor from '../../items/db/item_conveyor';
import { DBItemName } from '../../items/item_type';
import { DBBuilding } from '../building_type';

const building_conveyor: DBBuilding = {
  name: DBItemName.BUILDING_CONVEYOR,
  id: 7,
  height: 1,
  width: 1,
  item: item_conveyor,
  processing_ticks: 60,
  is_rotatable: true,
  inventory_slots: 2,
  items_to_be_placed_on: [],
  output_item: null,
  output_quantity: null,
  can_collide: false,
};
export default building_conveyor;
