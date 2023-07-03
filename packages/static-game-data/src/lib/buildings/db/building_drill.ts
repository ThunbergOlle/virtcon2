import item_coal from '../../items/db/item_coal';
import item_drill from '../../items/db/item_drill';
import item_iron from '../../items/db/item_iron';
import item_stone from '../../items/db/item_stone';
import { DBBuilding } from '../building_type';

const building_drill: DBBuilding = {
  name: 'Drill',
  id: 5,
  height: 1,
  width: 1,
  item: item_drill,
  processing_ticks: 80,
  is_rotatable: false,
  inventory_slots: 2,
  items_to_be_placed_on: [item_stone, item_coal, item_iron],
  output_item: null,
  output_quantity: 3,
  can_collide: true,
};
export default building_drill;
