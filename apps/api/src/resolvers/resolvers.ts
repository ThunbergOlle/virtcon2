import { ItemResolver } from './item/ItemResolver';
import { UserResolver } from './user/UserResolver';
import { WorldBuildingResolver } from './worldBuilding/WorldBuildingResolver';
import { WorldBuildingInventoryResolver } from './worldBuilding/WorldBuildingInventoryResolver';
import { UserInventoryItemResolver } from './user/UserInventoryResolver';
import { ItemRecipeResolver } from './item/ItemRecipeResolver';

export const resolvers = [
  ItemResolver,
  UserResolver,
  WorldBuildingResolver,
  WorldBuildingInventoryResolver,
  UserInventoryItemResolver,
  ItemRecipeResolver,
] as const;
