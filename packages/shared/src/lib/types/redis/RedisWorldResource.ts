// eslint-disable-next-line @nx/enforce-module-boundaries
import { DBItemName } from '@virtcon2/static-game-data';

export interface RedisWorldResource {
  id: string;
  x: number;
  y: number;
  item: {
    id: number;
    name: DBItemName;
  };
}
