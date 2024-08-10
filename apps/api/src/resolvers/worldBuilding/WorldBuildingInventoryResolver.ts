import { Item, WorldBuilding, WorldBuildingInventory } from '@virtcon2/database-postgres';
import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';

@Resolver(() => WorldBuildingInventory)
export class WorldBuildingInventoryResolver implements ResolverInterface<WorldBuildingInventory> {
  @FieldResolver(() => WorldBuilding)
  async world_building(@Root() worldBuildingInventory: WorldBuildingInventory): Promise<WorldBuilding> {
    return WorldBuilding.findOne({ where: { id: worldBuildingInventory.worldBuildingId } });
  }

  @FieldResolver(() => Item)
  async item(@Root() worldBuildingInventory: WorldBuildingInventory): Promise<Item | undefined> {
    if (!worldBuildingInventory.itemId) return null;
    return Item.findOne({ where: { id: worldBuildingInventory.itemId } });
  }
}
