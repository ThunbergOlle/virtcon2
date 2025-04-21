import { Item, Topic, UserInventoryItem } from '@virtcon2/database-postgres';
import { Arg, FieldResolver, ID, Int, Query, Resolver, ResolverInterface, Root, Subscription } from 'type-graphql';

@Resolver(() => UserInventoryItem)
export class UserInventoryItemResolver implements ResolverInterface<UserInventoryItem> {
  @Query(() => [UserInventoryItem], { nullable: false })
  @Subscription(() => [UserInventoryItem], {
    topics: Topic.USER_INVENTORY_UPDATE,
    filter: ({ payload, args }) => {
      return payload === Number(args.userId);
    },
  })
  @Query(() => [UserInventoryItem], { nullable: false })
  async userInventory(
    @Arg('userId', () => ID, { nullable: false })
    userId: number,
    @Arg('limit', () => Number, { nullable: true })
    limit: number,
  ) {
    return UserInventoryItem.find({
      where: { user: { id: userId } },
      take: limit,
      order: { slot: 'ASC' },
      cache: false,
    });
  }

  @FieldResolver(() => Item, { nullable: true })
  async item(@Root() inventoryItem: UserInventoryItem): Promise<Item> {
    if (!inventoryItem.itemId) return null;
    return Item.findOne({ where: { id: inventoryItem.itemId } });
  }

  @FieldResolver(() => Int, { nullable: false })
  async id(@Root() inventoryItem: UserInventoryItem): Promise<number> {
    return inventoryItem.id;
  }
}
