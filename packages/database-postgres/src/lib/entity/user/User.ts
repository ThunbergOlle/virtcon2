import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserInventoryItem } from '../user_inventory_item/UserInventoryItem';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => String)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => String)
  @Column({ type: 'text', unique: true })
  display_name: string;

  @Field(() => String)
  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', unique: true, select: false, nullable: true })
  token: string;

  @Column({ select: false, nullable: true, type: 'text' })
  password: string;

  @Field(() => String, { nullable: true })
  @Column('timestamp', { default: new Date(), nullable: true })
  last_login: Date;

  @Field(() => Int)
  @Column('int', { default: 0 })
  balance: number;

  @Column('text', { nullable: true })
  confirmationCode: string;

  @Field(() => Boolean)
  @Column('boolean', { nullable: false, default: false })
  isConfirmed: boolean;

  @Field(() => [UserInventoryItem])
  @OneToMany(() => UserInventoryItem, userInventoryItem => userInventoryItem.user)
  inventory: UserInventoryItem[];

}
