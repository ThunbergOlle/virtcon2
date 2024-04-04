import { ServerInventoryItem } from '@shared';

export interface PlayerInventoryServerPacket {
  player_id: number;
  inventory: Array<ServerInventoryItem>;
}
