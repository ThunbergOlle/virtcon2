import { Item, ItemRecipe } from '@virtcon2/database-postgres';
import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';

@Resolver(() => ItemRecipe)
export class ItemRecipeResolver implements ResolverInterface<ItemRecipe> {
  @FieldResolver(() => [ItemRecipe])
  async requiredItem(@Root() itemRecipe: ItemRecipe): Promise<Item> {
    return await Item.findOne({ where: { id: itemRecipe.requiredItemId } });
  }

  @FieldResolver(() => Item)
  async resultingItem(@Root() itemRecipe: ItemRecipe): Promise<Item> {
    return await Item.findOne({ where: { id: itemRecipe.resultingItemId } });
  }
}
