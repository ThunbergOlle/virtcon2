// eslint-disable-next-line @nx/enforce-module-boundaries
import { DBItem } from "@virtcon2/static-game-data";


export interface ServerInventoryItem {
  id: number;
  quantity: number;
  item: DBItem ;
}
