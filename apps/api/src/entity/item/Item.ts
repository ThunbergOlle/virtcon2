import { ItemName } from '@shared';
import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';



@ObjectType()
@Entity()
export class Item extends BaseEntity {
  @PrimaryColumn({ type: 'numeric', unique: true })
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

}
