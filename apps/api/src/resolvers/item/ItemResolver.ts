import { Building, Item, ItemRecipe, UserInventoryItem } from '@virtcon2/database-postgres';
import { Arg, Ctx, FieldResolver, Int, Mutation, Query, Resolver, ResolverInterface, Root } from 'type-graphql';
import { RequestContext } from '../../graphql/RequestContext';

@Resolver((of) => Item)
export class ItemResolver implements ResolverInterface<Item> {
  @Query(() => [Item], { nullable: true })
  async items() {
    return await Item.find({ relations: ['recipe', 'recipe.requiredItem', 'building', 'building.items_to_be_placed_on'] });
  }

  @FieldResolver(() => [ItemRecipe])
  async recipe(@Root() item: Item): Promise<ItemRecipe[]> {
    return await ItemRecipe.find({ where: { resultingItemId: item.id }, relations: ['requiredItem'] });
  }

  @FieldResolver(() => Building)
  async building(@Root() item: Item): Promise<Building> {
    return await Building.findOne({ where: { id: item.buildingId } });
  }

  @Mutation(() => UserInventoryItem, { nullable: true })
  async craftItem(
    @Arg('itemId', () => Int) itemId: number,
    @Arg('quantity', () => Int) quantity: number,
    @Ctx() context: RequestContext,
  ): Promise<UserInventoryItem> {
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

    const userItemQuantityMap: Record<number, number> = {};
    userItems
      .filter((i) => i.item !== null)
      .forEach((userItem) => {
        userItemQuantityMap[userItem.item.id] = (userItemQuantityMap[userItem.item.id] || 0) + userItem.quantity;
      });

    const hasRequiredItems = requiredItems.every((requiredItem) => {
      const quantity = userItemQuantityMap[requiredItem.item.id];
      return quantity && quantity >= requiredItem.quantity;
    });
    if (!hasRequiredItems) {
      throw new Error('Missing required items');
    }
    /* Remove the required items from the user's inventory */
    await Promise.all(
      requiredItems.map(async (requiredItem) => {
        await UserInventoryItem.addToInventory(context.user.id, requiredItem.item.id, -requiredItem.quantity);
      }),
    );
    /* Add the crafted item to the user's inventory */
    await UserInventoryItem.addToInventory(context.user.id, item.id, quantity);
    /* Return the crafted item */
    return await UserInventoryItem.findOne({ where: { user: { id: context.user.id }, item: { id: item.id } }, relations: ['item'] });
  }
}
