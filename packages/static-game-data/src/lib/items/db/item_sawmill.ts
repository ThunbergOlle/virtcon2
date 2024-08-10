import { DBBuilding } from '../building_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';
import item_wood from './item_wood';

const BUILDING_ID = 3;

export const item_sawmill: DBItem = {
  id: 3,
  name: DBItemName.BUILDING_SAWMILL,
  stack_size: 10,
  display_name: 'Sawmill',
  description: 'Sawmill can extract wood from trees.',
  icon: 'sawmill.png',
  rarity: DBItemRarity.common,
  buildingId: BUILDING_ID,
  is_building: true,
};

export const building_sawmill: DBBuilding = {
  name: DBItemName.BUILDING_SAWMILL,
  id: BUILDING_ID,
  height: 1,
  width: 1,
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
