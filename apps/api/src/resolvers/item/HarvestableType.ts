import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class HarvestableGraphQL {
  @Field(() => String)
  name: string;

  @Field(() => String)
  sprite: string;

  @Field(() => String)
  item: string;

  @Field(() => Number)
  full_health: number;

  @Field(() => Number)
  defaultDropCount: number;

  @Field(() => String)
  layer: string;

  @Field(() => Number)
  width: number;

  @Field(() => Number)
  height: number;
}
