import { DBBuilding } from '../building_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';
import item_coal from './item_coal';
import item_iron_ore from './item_iron';
import item_stone from './item_stone';

const ID = 5;

export const item_drill: DBItem = {
  id: ID,
  name: DBItemName.BUILDING_DRILL,
  display_name: 'Coal powered drill',
  description: 'Drills stone, coal, and iron. Requires 2 coal to operate.',
  icon: 'drill.png',
  rarity: DBItemRarity.common,
  stack_size: 64,
  is_building: true,
  buildingId: ID,
};

export const building_drill: DBBuilding = {
  name: DBItemName.BUILDING_DRILL,
  id: ID,
  height: 1,
  width: 1,
  item: item_drill,
  processing_ticks: 100,
  is_rotatable: false,
  inventory_slots: 2,
  items_to_be_placed_on: [item_stone, item_coal, item_iron_ore],
  processing_requirements: [{ item: item_coal, quantity: 2 }],
  output_item: null,
  output_quantity: 2,
  can_collide: true,
};
