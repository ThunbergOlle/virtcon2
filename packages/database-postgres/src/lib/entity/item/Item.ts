import { ItemName } from '@shared';
import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { UserInventoryItem } from '../user_inventory_item/UserInventoryItem';

@ObjectType()
@Entity()
export class Item extends BaseEntity {
  @PrimaryColumn({ type: 'int', unique: true })
  @Field(() => Int)
  id: number;

  @Field(() => String)
  @Column({ type: 'text' })
  name: string;

  @Field(() => String)
  @Column({ type: 'text' })
  display_name: ItemName;

  @Field(() => String)
  @Column({ type: 'text' })
  description: string;

  @Field(() => String)
  @Column({ type: 'text' })
  icon: string;

  @Field(() => String)
  @Column({ type: 'text' })
  type: string;

  @Field(() => String)
  @Column({ type: 'text' })
  rarity: string;

  @Field(() => [UserInventoryItem])
  @OneToMany(() => UserInventoryItem, (i) => i.id)
  inventory: UserInventoryItem[];
}