import { Field, Int, ObjectType } from 'type-graphql';
import { AfterInsert, AfterUpdate, BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { addToInventory } from '../../shared/InventoryManagement';
import { Item } from '../item/Item';
import { User } from '../user/User';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { DBUserInventoryItem } from '@virtcon2/static-game-data';

const pubsub = new RedisPubSub();
export const TOPIC_INVENTORY_UPDATE = 'BUILDING_UPDATE';

@ObjectType()
@Entity()
export class UserInventoryItem extends BaseEntity implements DBUserInventoryItem {
  @PrimaryColumn({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  user?: User;

  @PrimaryColumn({ type: 'int' })
  @Field(() => Int)
  slot: number;

  @Field(() => Item, { nullable: true })
  @ManyToOne(() => Item, (item) => item.id, { nullable: true })
  item?: Item;

  @Column({ type: 'int', nullable: true })
  itemId: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  quantity: number;

  @AfterInsert()
  @AfterUpdate()
  publishUpdate() {
    return pubsub.publish(`${TOPIC_INVENTORY_UPDATE}.${this.userId}`, this);
  }

  static async addToInventory(userId: number, itemId: number, quantity: number, slot?: number): Promise<number> {
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
