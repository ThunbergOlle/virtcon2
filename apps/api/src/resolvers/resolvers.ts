import { NonEmptyArray } from "type-graphql";
import { ItemResolver } from "./item/ItemResolver";
import { UserResolver } from "./user/UserResolver";

// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers = [ItemResolver, UserResolver] as NonEmptyArray<Function> | NonEmptyArray<string>
