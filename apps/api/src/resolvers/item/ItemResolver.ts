import { Item } from '@virtcon2/database-postgres';
import { Query, Resolver } from 'type-graphql';
@Resolver()
export class ItemResolver {
  @Query(() => [Item], { nullable: true })
  async Items() {
    return await Item.find();
  }
}
