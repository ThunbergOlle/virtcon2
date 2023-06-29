import { InventoryType, ServerInventoryItem } from "@shared";

export interface RequestMoveInventoryItemPacketData {
  fromInventoryType: InventoryType;
  fromInventorySlot: number;
  fromInventoryId: number;
  toInventoryType: InventoryType;
  toInventoryId: number;
  toInventorySlot: number;
  item: ServerInventoryItem
}
