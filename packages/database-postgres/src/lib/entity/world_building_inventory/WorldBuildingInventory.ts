import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../item/Item';
import { WorldBuilding } from '../world_building/WorldBuilding';

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

  static async addToInventory(worldBuildingId: number, itemId: number, quantiy: number): Promise<WorldBuildingInventory> {
    const worldBuildingItem = await WorldBuildingInventory.findOne({
      where: { world_building: { id: worldBuildingId }, item: { id: itemId } },
      relations: ['item'],
    });
    if (worldBuildingItem) {
      worldBuildingItem.quantity += quantiy;
      if (worldBuildingItem.quantity <= 0) {
        await worldBuildingItem.remove();
        return null;
      } else {
        await worldBuildingItem.save();
        return worldBuildingItem;
      }
    } else {
      const new_world_building_item = {
        world_building: { id: worldBuildingId },
        item: { id: itemId },
        quantity: quantiy,
      } as WorldBuildingInventory;
      await WorldBuildingInventory.create(new_world_building_item).save();
      return WorldBuildingInventory.findOne({ where: { world_building: { id: worldBuildingId }, item: { id: itemId } }, relations: ['item'] });
    }
  }
}
