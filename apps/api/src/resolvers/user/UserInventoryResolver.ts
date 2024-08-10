import { Item, TOPIC_INVENTORY_UPDATE, UserInventoryItem } from '@virtcon2/database-postgres';
import { Arg, FieldResolver, ID, Query, Resolver, ResolverInterface, Root, Subscription } from 'type-graphql';
import { withFilter } from 'graphql-subscriptions';
import { subscribe } from '../../service/RedisService';

@Resolver(() => UserInventoryItem)
export class UserInventoryItemResolver implements ResolverInterface<UserInventoryItem> {
  @Query(() => [UserInventoryItem], { nullable: false })
  @Subscription(() => [UserInventoryItem], {
    subscribe: withFilter(
      (_, args) => subscribe.asyncIterator(`${TOPIC_INVENTORY_UPDATE}.${args.userId}`),
      (payload, variables) => {
        return payload === parseInt(variables.userId);
      },
    ),
  })
  @Query(() => [UserInventoryItem], { nullable: false })
  async userInventory(
    @Arg('userId', () => ID, { nullable: false })
    userId: number,
  ) {
    return UserInventoryItem.find({
      where: { user: { id: userId } },
      cache: false,
    });
  }

  @FieldResolver(() => Item, { nullable: true })
  async item(@Root() inventoryItem: UserInventoryItem): Promise<Item> {
    if (!inventoryItem.itemId) return null;
    return Item.findOne({ where: { id: inventoryItem.itemId } });
  }
}
