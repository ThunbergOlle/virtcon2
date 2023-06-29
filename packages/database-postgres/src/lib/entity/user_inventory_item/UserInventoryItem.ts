import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Item } from '../item/Item';
import { User } from '../user/User';
import { addToInventory } from '../../shared/InventoryManagement';

@ObjectType()
@Entity()
export class UserInventoryItem extends BaseEntity {
  @PrimaryColumn({ type: 'int' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @PrimaryColumn({ type: 'int' })
  @Field(() => Int)
  slot: number;

  @Field(() => Item, { nullable: true })
  @ManyToOne(() => Item, (item) => item.id, { nullable: true })
  item?: Item;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  quantity: number;

  static async addToInventory(userId: string, itemId: number, quantity: number, slot?: number): Promise<number> {
    if (quantity === 0) {
      return;
    }

    const slots = await UserInventoryItem.find({
      where: { user: { id: userId } },
      relations: ['item'],
      order: { slot: 'ASC' },
    });

    return await addToInventory(slots, itemId, quantity, slot);
  }
}
