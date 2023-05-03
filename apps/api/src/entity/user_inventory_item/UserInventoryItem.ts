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
  @Field(() => User)
  user: User; // world ID is the player's display name

  @Field(() => Item)
  @ManyToOne(() => Item, (item) => item.id)
  item: Item;

  @Field(() => Int)
  @Column({ type: 'numeric' })
  quantity: number;

}
