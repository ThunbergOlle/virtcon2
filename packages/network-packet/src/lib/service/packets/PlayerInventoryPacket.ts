import { ServerInventoryItem } from '@shared';

export interface PlayerInventoryServerPacket {
  player_id: string;
  inventory: Array<ServerInventoryItem>;
}
