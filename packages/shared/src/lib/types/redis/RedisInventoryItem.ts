// eslint-disable-next-line @nx/enforce-module-boundaries
import { DBItem } from '@virtcon2/static-game-data';

export interface ServerInventoryItem {
  quantity: number;
  slot: number;
  item: DBItem | null;
}
