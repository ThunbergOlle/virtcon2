import { NonEmptyArray } from 'type-graphql';
import { ItemResolver } from './item/ItemResolver';
import { UserResolver } from './user/UserResolver';
import { WorldBuildingResolver } from './worldBuilding/WorldBuildingResolver';
import { WorldBuildingInventoryResolver } from './worldBuilding/WorldBuildingInventoryResolver';
import { UserInventoryItemResolver } from './user/UserInventoryResolver';

export const resolvers = [ItemResolver, UserResolver, WorldBuildingResolver, WorldBuildingInventoryResolver, UserInventoryItemResolver] as  // eslint-disable-next-line @typescript-eslint/ban-types
  | NonEmptyArray<Function>
  | NonEmptyArray<string>;
