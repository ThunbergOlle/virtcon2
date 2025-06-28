import { InvalidStateError, plotSize } from '@shared';
import { Item, World, WorldPlot } from '@virtcon2/database-postgres';
import { DBItemName, shouldGenerateResource } from '@virtcon2/static-game-data';
import { Arg, Ctx, Field, Int, Mutation, ObjectType, Query } from 'type-graphql';
import { RequestContext } from '../../graphql/RequestContext';

@ObjectType()
export class ExpandPlotPrice {
  @Field(() => Int, { nullable: false })
  count: number;

  @Field(() => Item, { nullable: false })
  item: Item;
}

export class PlotResolver {
  @Query(() => [ExpandPlotPrice], { nullable: true })
  async plotPrice(
    @Arg('x', () => Int, { nullable: false }) x: number,
    @Arg('y', () => Int, { nullable: false }) y: number,
    @Ctx() context: RequestContext,
  ): Promise<ExpandPlotPrice[]> {
    const inWorld = context.user?.currentlyInWorld;
    if (!inWorld) throw new InvalidStateError(`User ${context.user?.id} is not in a world.`);

    const world = await World.findOneOrFail({ where: { id: inWorld } });

    const existingPlots = await WorldPlot.count({
      where: { worldId: inWorld },
    });
    const priceMultiple = 8 ** existingPlots;

    return await calculatePlotPrice(world.seed, x, y, priceMultiple);
  }

  @Mutation(() => Int, { nullable: true })
  async expandPlot(@Ctx() context: RequestContext): Promise<number> {
    return 0;
  }
}

const calculatePlotPrice = async (worldSeed: number, plotX: number, plotY: number, priceMultiple: number): Promise<ExpandPlotPrice[]> => {
  const resources: { [key: string]: number } = {};
  for (let x = plotX; x < plotX + plotSize; x++) {
    for (let y = plotY; y < plotY + plotSize; y++) {
      const { shouldSpawn, resource } = shouldGenerateResource(x, y, worldSeed);
      if (!shouldSpawn || !resource) continue;
      resources[resource.name] = (resources[resource.name] || 0) + 1;
    }
  }

  const prices: ExpandPlotPrice[] = [];
  for (const [name, count] of Object.entries(resources)) {
    const item = await Item.findOne({ where: { name: name as DBItemName } });
    if (!item) continue;

    prices.push({
      count: Math.ceil(count * 10 * priceMultiple),
      item,
    });
  }

  return prices;
};
