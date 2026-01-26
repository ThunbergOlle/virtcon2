import { HarvestableNames } from '@virtcon2/static-game-data';
import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { World } from '../world/World';

@ObjectType()
@Entity()
export class WorldHarvestable extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  @Field(() => Int)
  id: number;

  @Field(() => World)
  @ManyToOne(() => World, (world) => world.id)
  world: World;

  @Column({ type: 'varchar' })
  worldId: string;

  @Column({ type: 'varchar', nullable: false })
  harvestableName: HarvestableNames;

  @Column({ type: 'int', nullable: false, default: 0 })
  age: number; // age in ticks. This will determine the state/sprite of the harvestable.

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  x: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  y: number;
}
