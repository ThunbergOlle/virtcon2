import { InventoryType, ServerInventoryItem } from "@shared";

export interface RequestMoveInventoryItemPacketData {
  fromInventoryType: InventoryType;
  fromInventoryId: number;
  toInventoryType: InventoryType;
  toInventoryId: number;
  item: ServerInventoryItem
}
