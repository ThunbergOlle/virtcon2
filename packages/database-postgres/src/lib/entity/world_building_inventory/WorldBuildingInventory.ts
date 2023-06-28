import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../item/Item';
import { WorldBuilding } from '../world_building/WorldBuilding';
import { InventoryFullError } from '../../error/InventoryFullError';
import { LogLevel, LogApp } from '@shared';
import { log } from 'console';

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
    const world_building_inventory = await WorldBuildingInventory.find({
      where: { world_building: { id: worldBuildingId } },
      relations: ['item'],
    });
    const [{ building }, { stack_size }] = await Promise.all([
      WorldBuilding.findOne({ where: { id: worldBuildingId }, relations: ['building'] }),
      Item.findOne({ where: { id: itemId } }),
    ]);

    const similiarItemInInventory = world_building_inventory.find((i) => i.item.id === itemId && i.quantity !== stack_size);

    const new_desired_quantity = similiarItemInInventory ? similiarItemInInventory.quantity + quantity : quantity;
    const new_reality_quantity = new_desired_quantity > stack_size ? stack_size : new_desired_quantity;

    const remainder = new_desired_quantity - new_reality_quantity;

    if (similiarItemInInventory && new_reality_quantity <= 0) {
      await similiarItemInInventory.remove();
      return 0;
    }

    if (!similiarItemInInventory && world_building_inventory.length < building.inventory_slots) {
      return await createNewStack(worldBuildingId, itemId, quantity);
    }

    if (similiarItemInInventory) {
      similiarItemInInventory.quantity = new_reality_quantity;
      await similiarItemInInventory.save();
    }
    if (remainder > 0 && world_building_inventory.length < building.inventory_slots) {
      return await createNewStack(worldBuildingId, itemId, remainder);
    }

    return remainder;
  }
}
async function createNewStack(worldBuildingId: number, itemId: number, quantity: number) {
  const new_world_building_item = {
    world_building: { id: worldBuildingId },
    item: { id: itemId },
    quantity: quantity,
  } as WorldBuildingInventory;
  await WorldBuildingInventory.create(new_world_building_item).save();
  return 0;
}
