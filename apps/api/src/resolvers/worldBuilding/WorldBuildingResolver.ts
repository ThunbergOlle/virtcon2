import { TOPIC_BUILDING_UPDATE, WorldBuilding, WorldBuildingInventory, Building } from '@virtcon2/database-postgres';
import { withFilter } from 'graphql-subscriptions';
import { Arg, FieldResolver, ID, Query, Resolver, ResolverInterface, Root, Subscription } from 'type-graphql';
import { subscribe } from '../../service/RedisService';

@Resolver(() => WorldBuilding)
export class WorldBuildingResolver implements ResolverInterface<WorldBuilding> {
  @Query(() => WorldBuilding)
  @Subscription(() => WorldBuilding, {
    subscribe: withFilter(
      (_, args) => subscribe.asyncIterator(`${TOPIC_BUILDING_UPDATE}.${args.id}`),
      (payload, variables) => {
        return payload === parseInt(variables.id);
      },
    ),
  })
  worldBuilding(
    @Arg('id', () => ID, { nullable: false })
    id: number,
  ): Promise<WorldBuilding | undefined> {
    return WorldBuilding.findOne({ where: { id } });
  }

  @FieldResolver(() => Building, { nullable: true })
  async building(@Root() worldBuilding: WorldBuilding): Promise<Building> {
    if (!worldBuilding.buildingId) return null;
    return Building.findOne({ where: { id: worldBuilding.buildingId } });
  }

  @FieldResolver(() => [WorldBuildingInventory], { nullable: true })
  async world_building_inventory(@Root() worldBuilding: WorldBuilding): Promise<WorldBuildingInventory[] | undefined> {
    return WorldBuildingInventory.find({ where: { worldBuildingId: worldBuilding.id } });
  }

  @FieldResolver(() => WorldBuilding, { nullable: true })
  async output_world_building(@Root() worldBuilding: WorldBuilding): Promise<WorldBuilding | undefined> {
    if (!worldBuilding.outputWorldBuildingId) return null;
    return WorldBuilding.findOne({ where: { id: worldBuilding.outputWorldBuildingId } });
  }
}
