import { DBItem, DBItemName } from './item_type';

export interface DBBuildingProcessingRequirement {
  item: DBItem;
  quantity: number;
}

export interface DBBuilding {
  name: DBItemName;
  id: number;
  item: DBItem;
  is_rotatable?: boolean;
  items_to_be_placed_on: DBItem[];
  output_item: DBItem | null;
  output_quantity: number | null;
  processing_ticks: number;
  inventory_transfer_quantity_per_cycle?: number;
  inventory_slots: number;
  width: number;
  height: number;
  can_collide: boolean;
  processing_requirements: DBBuildingProcessingRequirement[];
}

export interface DBWorldBuilding {
  id: number;
  x: number;
  y: number;
  rotation: number;
  building: DBBuilding;
  output_world_building: DBWorldBuilding | null;
  world_building_inventory: DBWorldBuildingInventoryItem[];
  active: boolean;
}

export interface DBWorldBuildingInventoryItem {
  slot: number;
  item: DBItem;
  quantity: number;
}
