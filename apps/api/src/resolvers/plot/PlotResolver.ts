import { INTERNAL_EVENTS, InvalidStateError, plotSize } from '@shared';
import { addToInventory, AppDataSource, Item, UserInventoryItem, World, WorldPlot } from '@virtcon2/database-postgres';
import { DBItemName, shouldGenerateResource } from '@virtcon2/static-game-data';
import { Arg, Ctx, Field, Int, Mutation, ObjectType, Query } from 'type-graphql';
import { RequestContext } from '../../graphql/RequestContext';
import { hasInInventory } from '../user/UserInventoryResolver';

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

  @Mutation(() => [WorldPlot], { nullable: true })
  async expandPlot(
    @Arg('x', () => Int, { nullable: false }) x: number,
    @Arg('y', () => Int, { nullable: false }) y: number,
    @Ctx() context: RequestContext,
  ): Promise<WorldPlot[]> {
    const inWorld = context.user?.currentlyInWorld;
    if (!inWorld) throw new InvalidStateError(`User ${context.user?.id} is not in a world.`);
    const world = await World.findOneOrFail({ where: { id: inWorld } });

    const plotAlreadyExpanded = await WorldPlot.findOne({
      where: { worldId: inWorld, x, y },
    });
    if (plotAlreadyExpanded) throw new InvalidStateError(`Plot at (${x}, ${y}) in world ${inWorld} is already expanded.`);

    const existingPlots = await WorldPlot.count({
      where: { worldId: inWorld },
    });

    const priceMultiple = 8 ** existingPlots;
    const prices = await calculatePlotPrice(world.seed, x, y, priceMultiple);

    for (const price of prices) {
      const inventory = await hasInInventory(context.user.id, price.item.id, price.count);
      if (!inventory) {
        throw new InvalidStateError(`User ${context.user.id} does not have enough ${price.item.name} to expand the plot.`);
      }
    }

    const inventory = await UserInventoryItem.find({
      where: { userId: context.user.id },
    });

    await AppDataSource.transaction(async (transaction) => {
      for (const price of prices) {
        await addToInventory(transaction, inventory, price.item.id, -price.count);
      }
    });

    const plot = new WorldPlot();
    plot.worldId = inWorld;
    plot.x = x;
    plot.y = y;
    await WorldPlot.save(plot);

    // @ts-ignore
    await fetch(`${process.env.PACKET_ROUTER_URL}/internal/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: INTERNAL_EVENTS.EXPAND_PLOT,
        world: inWorld,
      }),
    }).catch((error) => {
      console.error(`Failed to notify packet router about plot expansion: ${error.message}`);
    });

    return [plot];
  }
}

export const calculatePlotPrice = async (
  worldSeed: number,
  plotX: number,
  plotY: number,
  priceMultiple: number,
): Promise<ExpandPlotPrice[]> => {
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
