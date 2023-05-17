import item_sawmill from '../../items/db/item_sawmill';
import item_wood from '../../items/db/item_wood';
import { DBBuilding } from '../building_type';

const building_sawmill: DBBuilding = {
  id: 3,
  height: 2,
  width: 2,
  item: item_sawmill,
  processing_ticks: 100,
  item_to_be_placed_on: item_wood,
};
export default building_sawmill;
