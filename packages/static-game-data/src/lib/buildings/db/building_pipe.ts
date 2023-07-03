import item_pipe from '../../items/db/item_pipe';
import { DBBuilding } from '../building_type';

const building_pipe: DBBuilding = {
  name: 'Pipe',
  id: 4,
  height: 1,
  width: 1,
  item: item_pipe,
  processing_ticks: 40,
  is_rotatable: true,
  inventory_slots: 2,
  items_to_be_placed_on: [],
  output_item: null,
  output_quantity: null,
  can_collide: true,
};
export default building_pipe;
