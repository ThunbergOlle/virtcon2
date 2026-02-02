import { DBBuilding } from '../building_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const ID = 16;

export const item_conveyor: DBItem = {
  id: ID,
  name: DBItemName.BUILDING_CONVEYOR,
  display_name: 'Conveyor Belt',
  description: 'Moves items in the direction it faces.',
  icon: 'building_conveyor.png',
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
  processing_ticks: 0,
  items_to_be_placed_on: [],
  is_rotatable: true,
  inventory_slots: [],
  output_item: null,
  can_collide: false,
  output_quantity: 0,
  processing_requirements: [],
  fuel_requirements: [],
};
