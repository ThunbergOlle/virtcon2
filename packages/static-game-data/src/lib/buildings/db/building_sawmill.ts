import item_sawmill from '../../items/db/item_sawmill';
import item_wood from '../../items/db/item_wood';
import { DBItemName } from '../../items/item_type';
import { DBBuilding } from '../building_type';

const building_sawmill: DBBuilding = {
  name: DBItemName.BUILDING_SAWMILL,
  id: 3,
  height: 2,
  width: 2,
  item: item_sawmill,
  processing_ticks: 100,
  items_to_be_placed_on: [item_wood],
  is_rotatable: false,
  inventory_transfer_quantity_per_cycle: 5,
  inventory_slots: 3,
  output_item: item_wood,
  can_collide: true,
  output_quantity: 2,
  processing_requirements: [],
};
export default building_sawmill;
