import item_conveyor from '../../items/db/item_conveyor';
import { DBBuilding } from '../building_type';

const building_conveyor: DBBuilding = {
  name: 'Conveyor',
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
};
export default building_conveyor;
