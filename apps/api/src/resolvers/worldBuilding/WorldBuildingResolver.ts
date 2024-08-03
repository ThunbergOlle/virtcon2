import { TOPIC_BUILDING_UPDATE, WorldBuilding } from '@virtcon2/database-postgres';
import { withFilter } from 'graphql-subscriptions';
import { Arg, ID, Query, Resolver, Subscription } from 'type-graphql';
import { subscribe } from '../../service/RedisService';

@Resolver()
export class WorldBuildingResolver {
  @Subscription(() => WorldBuilding, {
    subscribe: withFilter(
      (_, args) => subscribe.asyncIterator(`${TOPIC_BUILDING_UPDATE}.${args.id}`),
      (payload, variables) => {
        console.log(payload, variables);
        return payload.world_building.id === variables.id;
      },
    ),
  })
  inspectWorldBuilding(
    @Arg('id', () => ID, { nullable: false })
    id: number,
  ): Promise<WorldBuilding> {
    return WorldBuilding.findOne({ where: { id } });
  }

  @Query(() => WorldBuilding)
  async worldBuilding(
    @Arg('id', () => ID, { nullable: false })
    id: number,
  ): Promise<WorldBuilding | undefined> {
    return WorldBuilding.findOne({ where: { id } });
  }
}
