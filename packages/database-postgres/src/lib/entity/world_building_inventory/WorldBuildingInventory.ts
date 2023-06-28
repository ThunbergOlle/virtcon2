import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../item/Item';
import { WorldBuilding } from '../world_building/WorldBuilding';
import { LogLevel, LogApp, log } from '@shared';
import { Building } from '../building/Building';

@ObjectType()
@Entity()
export class WorldBuildingInventory extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Field(() => String)
  id: string;

  @ManyToOne(() => WorldBuilding, (wb) => wb.id)
  @Field(() => WorldBuilding)
  world_building: WorldBuilding;

  /* Item  */
  @ManyToOne(() => Item)
  @Field(() => Item)
  item: Item;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  quantity: number;

  // returns remainder of quantity that could not be added
  static async addToInventory(worldBuildingId: number, itemId: number, quantity: number): Promise<number> {
    if (quantity === 0) {
      return 0;
    }
    const world_building_inventory = await WorldBuildingInventory.find({
      where: { world_building: { id: worldBuildingId } },
      relations: ['item'],
    });
    const [{ building }, { stack_size }] = await Promise.all([
      WorldBuilding.findOne({ where: { id: worldBuildingId }, relations: ['building'] }),
      Item.findOne({ where: { id: itemId } }),
    ]);

    if (quantity < 0) {
      return handleNegativeQuantities(world_building_inventory, itemId, quantity, building);
    }

    // From now on, we are only dealing with positive quantities

    const similiar_inventory_stack = world_building_inventory.filter((i) => i.item.id === itemId);
    const stack_with_space = similiar_inventory_stack.find((i) => i.quantity < stack_size);

    log(`Adding ${quantity} of item ${itemId} to inventory of building ${worldBuildingId}`, LogLevel.INFO, LogApp.DATABASE_POSTGRES);

    const new_quantity = stack_with_space ? stack_with_space.quantity + quantity : quantity;

    // this will be the remainder of the quantity that could not be added
    const remainder = stack_with_space ? Math.max(0, new_quantity - stack_size) : quantity;

    // create a new stack if we have space and if we need to.
    if (!stack_with_space && world_building_inventory.length < building.inventory_slots) {
      return await createNewStack(worldBuildingId, itemId, new_quantity, stack_size);
    }
    // if there is a stack with space, add to it
    if (stack_with_space) {
      stack_with_space.quantity = Math.min(new_quantity, stack_size);
      await stack_with_space.save();
      return remainder;
    }

    return remainder;
  }
}
async function createNewStack(worldBuildingId: number, itemId: number, quantity: number, stack_size: number) {
  const new_world_building_item = {
    world_building: { id: worldBuildingId },
    item: { id: itemId },
    quantity: Math.min(quantity, stack_size),
  } as WorldBuildingInventory;
  await WorldBuildingInventory.create(new_world_building_item).save();
  return quantity - stack_size;
}

async function handleNegativeQuantities(
  world_building_inventory: WorldBuildingInventory[],
  itemId: number,
  quantity: number,
  building: Building,
): Promise<number> {
  const similiar_inventory_stack = world_building_inventory.filter((i) => i.item.id === itemId);
  if (!similiar_inventory_stack.length) {
    log(`Cannot remove ${quantity} of item ${itemId} from inventory of building ${building.id} 📮`, LogLevel.ERROR, LogApp.DATABASE_POSTGRES);
    return quantity;
  }
  let quantity_to_remove = Math.abs(quantity);
  for (let i = 0; i < similiar_inventory_stack.length; i++) {
    if (quantity_to_remove === 0) {
      break;
    }
    const stack = similiar_inventory_stack[i];
    const quantity_to_remove_from_stack = Math.min(quantity_to_remove, stack.quantity);
    stack.quantity -= quantity_to_remove_from_stack;
    quantity_to_remove -= quantity_to_remove_from_stack;
  }

  await Promise.all(similiar_inventory_stack.map((i) => (i.quantity > 0 ? i.save() : i.remove())));
  return -quantity_to_remove;
}
