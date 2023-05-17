import { Item, UserInventoryItem } from '@virtcon2/database-postgres';
import { Arg, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';
import { RequestContext } from '../../graphql/RequestContext';
@Resolver()
export class ItemResolver {
  @Query(() => [Item], { nullable: true })
  async Items() {
    return await Item.find({ relations: ['recipe', 'recipe.requiredItem', 'building', 'building.item_to_be_placed_on'] });
  }

  @Mutation(() => UserInventoryItem, { nullable: true })
  async craftItem(@Arg('itemId', () => Int) itemId: number, @Arg('quantity', () => Int) quantity: number, @Ctx() context: RequestContext): Promise<UserInventoryItem> {
    /* Get the recipe for the item with the item id */
    const item = await Item.findOne({ where: { id: itemId }, relations: ['recipe', 'recipe.requiredItem'] });
    if (!item) {
      throw new Error('Item not found');
    }
    /* Check if the user has the required items */
    const requiredItems = item.recipe.map((recipe) => {
      return {
        item: recipe.requiredItem,
        quantity: recipe.requiredQuantity * quantity,
      };
    });

    const userItems = await UserInventoryItem.find({ where: { user: { id: context.user.id } }, relations: ['item'] });

    const usersItemsMap: Record<number, UserInventoryItem> = {};
    userItems.forEach((userItem) => {
      usersItemsMap[userItem.item.id] = userItem;
    });

    const hasRequiredItems = requiredItems.every((requiredItem) => {
      const userItem = usersItemsMap[requiredItem.item.id];
      return userItem && userItem.quantity >= requiredItem.quantity;
    });
    if (!hasRequiredItems) {
      throw new Error('Missing required items');
    }
    /* Remove the required items from the user's inventory */
    await Promise.all(
      requiredItems.map(async (requiredItem) => {
        const userItem = usersItemsMap[requiredItem.item.id];
        userItem.quantity -= requiredItem.quantity;
        await userItem.save();
      }),
    );
    /* Add the crafted item to the user's inventory */
    return await UserInventoryItem.addToInventory(context.user.id, item.id, quantity);
  }
}
