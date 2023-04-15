import { Query, Resolver } from 'type-graphql';
import { Item } from '../../entity/item/Item';
@Resolver()
export class ItemResolver {
  @Query(() => [Item], { nullable: true })
  async Items() {
    return await Item.find();
  }
}
