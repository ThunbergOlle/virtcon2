import { DBBuilding, WorldBuildingInventorySlotType } from '../building_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const ID = 19;

export const item_assembler: DBItem = {
  id: ID,
  name: DBItemName.BUILDING_ASSEMBLER,
  display_name: 'Assembler',
  description: 'Automatically crafts items from ingredients.',
  icon: 'building_assembler.png',
  rarity: DBItemRarity.common,
  stack_size: 10,
  craftingTime: 15000,
  is_building: true,
  buildingId: ID,
};

export const building_assembler: DBBuilding = {
  name: DBItemName.BUILDING_ASSEMBLER,
  id: ID,
  height: 1,
  width: 1,
  item: item_assembler,
  processing_ticks: 20,
  items_to_be_placed_on: [],
  is_rotatable: false,
  can_collide: true,
  inventory_slots: [
    WorldBuildingInventorySlotType.INPUT,
    WorldBuildingInventorySlotType.INPUT,
    WorldBuildingInventorySlotType.INPUT,
    WorldBuildingInventorySlotType.INPUT,
    WorldBuildingInventorySlotType.OUTPUT,
  ],
  output_item: null,
  output_quantity: null,
  processing_requirements: [],
  fuel_requirements: [],
};
