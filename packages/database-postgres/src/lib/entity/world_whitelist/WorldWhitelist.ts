import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/User';
import { World } from '../world/World';

export enum AccessLevel {
  visitor = 'visitor',
  member = 'member',
  admin = 'admin',
  owner = 'owner',
}

@ObjectType()
@Entity()
export class WorldWhitelist extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  @Field(() => Number)
  id: number;

  @Field(() => World)
  @ManyToOne(() => World, (world) => world.id)
  world: World;

  @ManyToOne(() => User, (user) => user.id)
  @Field(() => User)
  user: User;

  @Field(() => String)
  @Column({ type: 'text', default: AccessLevel.visitor })
  access_level: AccessLevel;
}
