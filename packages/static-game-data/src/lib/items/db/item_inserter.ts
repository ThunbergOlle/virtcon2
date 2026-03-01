import { DBBuilding } from '../building_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const ID = 17;

export const item_inserter: DBItem = {
  id: ID,
  name: DBItemName.BUILDING_INSERTER,
  display_name: 'Inserter',
  description: 'Automatically transfers items between conveyors and buildings.',
  icon: 'building_inserter.png',
  rarity: DBItemRarity.common,
  stack_size: 64,
  craftingTime: 5000,
  is_building: true,
  buildingId: ID,
};

export const building_inserter: DBBuilding = {
  name: DBItemName.BUILDING_INSERTER,
  id: ID,
  height: 1,
  width: 1,
  item: item_inserter,
  processing_ticks: 20,
  items_to_be_placed_on: [],
  is_rotatable: true,
  inventory_slots: [],
  output_item: null,
  can_collide: true,
  output_quantity: 0,
  processing_requirements: [],
  fuel_requirements: [],
};
