import { NonEmptyArray } from 'type-graphql';
import { ItemResolver } from './item/ItemResolver';
import { UserResolver } from './user/UserResolver';
import { WorldBuildingResolver } from './worldBuilding/WorldBuildingResolver';

// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers = [ItemResolver, UserResolver, WorldBuildingResolver] as NonEmptyArray<Function> | NonEmptyArray<string>;
