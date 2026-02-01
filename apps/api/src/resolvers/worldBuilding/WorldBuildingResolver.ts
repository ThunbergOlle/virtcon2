import { WorldBuilding, WorldBuildingInventory, Building, Topic } from '@virtcon2/database-postgres';
import { Arg, FieldResolver, ID, Query, Resolver, ResolverInterface, Root, Subscription } from 'type-graphql';

@Resolver(() => WorldBuilding)
export class WorldBuildingResolver implements ResolverInterface<WorldBuilding> {
  @Query(() => WorldBuilding)
  @Subscription(() => WorldBuilding, {
    topics: Topic.BUILDING_UPDATE,
    filter: ({ payload, args }) => {
      return payload === Number(args.id);
    },
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
    return Building.findOne({
      where: { id: worldBuilding.buildingId },
      relations: ['processing_requirements', 'processing_requirements.item', 'fuel_requirements', 'fuel_requirements.item'],
    });
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
