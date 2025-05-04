import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { World } from '../world/World';

@ObjectType()
@Entity()
export class WorldPlot extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number;

  @Field(() => World)
  @ManyToOne(() => World, (world) => world.id)
  world: World;
  @Column({ type: 'varchar' })
  worldId: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  startX: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  startY: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  endX: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  endY: number;
}
