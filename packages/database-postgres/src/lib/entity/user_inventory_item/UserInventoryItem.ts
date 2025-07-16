import { log } from '@shared';
import { DBUserInventoryItem } from '@virtcon2/static-game-data';
import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, EntityManager, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { pubSub, Topic } from '../../pubsub';
import { addToInventory } from '../../shared/InventoryManagement';
import { Item } from '../item/Item';
import { User } from '../user/User';

export const publishUserInventoryUpdate = createDebounceMap((userId: number) => {
  pubSub.publish(Topic.USER_INVENTORY_UPDATE, userId);
  log(`Publishing update for ${Topic.USER_INVENTORY_UPDATE}.${userId}`);
}, 200);

@ObjectType()
@Entity()
export class UserInventoryItem extends BaseEntity implements DBUserInventoryItem {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
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

function createDebounceMap<T>(fn: (id: T) => void, delay: number) {
  const timeouts = new Map<T, NodeJS.Timeout>();

  return (id: T) => {
    if (timeouts.has(id)) {
      clearTimeout(timeouts.get(id));
    }

    const timeout = setTimeout(() => {
      fn(id);
      timeouts.delete(id);
    }, delay);

    timeouts.set(id, timeout);
  };
}
