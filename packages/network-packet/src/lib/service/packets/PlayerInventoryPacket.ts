import { ServerInventoryItem } from "@shared";

export interface PlayerInventoryPacketData {
  player_id: string;
  inventory: Array<ServerInventoryItem>;
}
