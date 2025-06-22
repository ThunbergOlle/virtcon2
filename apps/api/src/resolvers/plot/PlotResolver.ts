import { AppDataSource, Building, Item, ItemRecipe, publishUserInventoryUpdate, UserInventoryItem } from '@virtcon2/database-postgres';
import { Arg, Ctx, Field, FieldResolver, Int, Mutation, ObjectType, Query, Resolver, ResolverInterface, Root } from 'type-graphql';
import { RequestContext } from '../../graphql/RequestContext';

@ObjectType()
export class ExpandPlot {
  @Field(() => Int, { nullable: true })
  price: number;
}

export class PlotResolver {
  @Query(() => Int, { nullable: true })
  async plotPrice() {
    return 0;
  }

  @Mutation(() => Int, { nullable: true })
  async expandPlot(@Ctx() context: RequestContext): Promise<number> {
    return 0;
  }
}
