import { DBBuilding } from '../building_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const BUILDING_ID = 4;

export const item_pipe: DBItem = {
  id: 4,
  name: DBItemName.BUILDING_PIPE,
  display_name: 'Pipe',
  description: 'Use pipes to connect machines together.',
  icon: 'pipe.png',
  rarity: DBItemRarity.common,
  stack_size: 64,
  buildingId: BUILDING_ID,
  is_building: true,
};

export const building_pipe: DBBuilding = {
  name: DBItemName.BUILDING_PIPE,
  id: BUILDING_ID,
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
  processing_requirements: [],
};
