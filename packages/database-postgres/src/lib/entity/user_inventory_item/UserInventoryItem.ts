import { log } from '@shared';
import { DBUserInventoryItem } from '@virtcon2/static-game-data';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, EntityManager, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { addToInventory } from '../../shared/InventoryManagement';
import { Item } from '../item/Item';
import { User } from '../user/User';

const pubsub = new RedisPubSub();
export const TOPIC_INVENTORY_UPDATE = 'USER_INVENTORY_UPDATE';
export const publishUserInventoryUpdate = async function (userId: number) {
  log(`Publishing update for ${TOPIC_INVENTORY_UPDATE}.${userId}`);
  return pubsub.publish(`${TOPIC_INVENTORY_UPDATE}.${userId}`, userId);
};

@ObjectType()
@Entity()
export class UserInventoryItem extends BaseEntity implements DBUserInventoryItem {
  @PrimaryGeneratedColumn({ type: 'int' })
  @Field(() => Int, { nullable: false })
  id: number;

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

  static async addToInventory(
    transaction: EntityManager,
    userId: number,
    itemId: number,
    quantity: number,
    slot?: number,
  ): Promise<number> {
    if (quantity === 0) {
      return;
    }

    const slots = await transaction.find(UserInventoryItem, {
      where: { user: { id: userId } },
      relations: ['item'],
      order: { slot: 'ASC' },
    });

    return await addToInventory(transaction, slots, itemId, quantity, slot);
  }
}
