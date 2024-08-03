import { TOPIC_BUILDING_UPDATE, WorldBuilding, WorldBuildingInventory, WorldResource, Building } from '@virtcon2/database-postgres';
import { withFilter } from 'graphql-subscriptions';
import { Arg, FieldResolver, ID, Query, Resolver, ResolverInterface, Root, Subscription } from 'type-graphql';
import { subscribe } from '../../service/RedisService';

@Resolver((of) => WorldBuilding)
export class WorldBuildingResolver implements ResolverInterface<WorldBuilding> {
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

  @FieldResolver(() => Building)
  async building(@Root() worldBuilding: WorldBuilding): Promise<Building> {
    return Building.findOne({ where: { id: worldBuilding.buildingId } });
  }

  @FieldResolver(() => WorldResource, { nullable: true })
  async world_resource(@Root() worldBuilding: WorldBuilding): Promise<WorldResource | undefined> {
    return WorldResource.findOne({ where: { id: worldBuilding.worldResourceId } });
  }

  @FieldResolver(() => [WorldBuildingInventory], { nullable: true })
  async world_building_inventory(@Root() worldBuilding: WorldBuilding): Promise<WorldBuildingInventory[] | undefined> {
    return WorldBuildingInventory.find({ where: { worldBuildingId: worldBuilding.id } });
  }
}
