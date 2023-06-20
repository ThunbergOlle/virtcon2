import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../item/Item';
import { User } from '../user/User';

@ObjectType()
@Entity()
export class UserInventoryItem extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Field(() => Item)
  @ManyToOne(() => Item, (item) => item.id)
  item: Item;

  @Field(() => Int)
  @Column({ type: 'int' })
  quantity: number;

  static async addToInventory(userId: string, itemId: number, quantiy: number): Promise<UserInventoryItem> {
    console.log('addToInventory', userId, itemId, quantiy);
    const userInventoryItem = await UserInventoryItem.findOne({ where: { user: { id: userId }, item: { id: itemId } }, relations: ['item'] });
    if (userInventoryItem) {
      userInventoryItem.quantity += quantiy;
      if (userInventoryItem.quantity <= 0) {
        await userInventoryItem.remove();
        return null;
      } else {
        await userInventoryItem.save();
        return userInventoryItem;
      }
    } else {
      const new_user_inventory_item = {
        user: { id: userId },
        item: { id: itemId },
        quantity: quantiy,
      } as UserInventoryItem;
      await UserInventoryItem.create(new_user_inventory_item).save();
      return UserInventoryItem.findOne({ where: { user: { id: userId }, item: { id: itemId } }, relations: ['item'] });
    }
  }
}
