import { DBBuilding, WorldBuildingInventorySlotType } from '../building_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const ID = 18;

export const item_crate: DBItem = {
  id: ID,
  name: DBItemName.BUILDING_CRATE,
  display_name: 'Crate',
  description: 'A storage container for items.',
  icon: 'building_crate.png',
  rarity: DBItemRarity.common,
  stack_size: 64,
  is_building: true,
  buildingId: ID,
};

export const building_crate: DBBuilding = {
  name: DBItemName.BUILDING_CRATE,
  id: ID,
  height: 1,
  width: 1,
  item: item_crate,
  processing_ticks: 0,
  items_to_be_placed_on: [],
  is_rotatable: false,
  inventory_slots: [
    WorldBuildingInventorySlotType.INPUT_AND_OUTPUT,
    WorldBuildingInventorySlotType.INPUT_AND_OUTPUT,
    WorldBuildingInventorySlotType.INPUT_AND_OUTPUT,
    WorldBuildingInventorySlotType.INPUT_AND_OUTPUT,
    WorldBuildingInventorySlotType.INPUT_AND_OUTPUT,
    WorldBuildingInventorySlotType.INPUT_AND_OUTPUT,
  ],
  output_item: null,
  can_collide: true,
  output_quantity: 0,
  processing_requirements: [],
  fuel_requirements: [],
};
