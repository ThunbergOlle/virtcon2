import { DBBuilding } from '../building_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const ID = 7;

export const item_conveyor: DBItem = {
  id: ID,
  name: DBItemName.BUILDING_CONVEYOR,
  display_name: 'Conveyor Belt',
  description: 'Conveyor Belt can transport items.',
  icon: 'conveyor.png',
  rarity: DBItemRarity.common,
  stack_size: 64,
  is_building: true,
  buildingId: ID,
};

export const building_conveyor: DBBuilding = {
  name: DBItemName.BUILDING_CONVEYOR,
  id: ID,
  height: 1,
  width: 1,
  item: item_conveyor,
  processing_ticks: 60,
  is_rotatable: true,
  inventory_slots: 2,
  items_to_be_placed_on: [],
  processing_requirements: [],
  output_item: null,
  output_quantity: null,
  can_collide: false,
};
