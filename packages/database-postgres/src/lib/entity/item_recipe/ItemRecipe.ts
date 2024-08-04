import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Item } from '../item/Item';

@ObjectType()
@Entity()
export class ItemRecipe extends BaseEntity {
  @Field(() => Int)
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Field(() => Item)
  @ManyToOne(() => Item, (Item) => Item.id, { nullable: false })
  requiredItem: Item;
  @Column({ type: 'int' })
  requiredItemId: number;

  @Field(() => Int)
  @Column({ type: 'int' })
  requiredQuantity: number;

  @ManyToOne(() => Item, (Item) => Item.id, { nullable: false })
  resultingItem: Item;
  @Column({ type: 'int' })
  resultingItemId: number;
}
