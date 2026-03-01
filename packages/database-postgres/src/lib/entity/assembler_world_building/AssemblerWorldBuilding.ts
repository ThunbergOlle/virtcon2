import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../item/Item';
import { WorldBuilding } from '../world_building/WorldBuilding';

@ObjectType()
@Entity()
export class AssemblerWorldBuilding extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  @Field(() => Int)
  id: number;

  @OneToOne(() => WorldBuilding, { onDelete: 'CASCADE' })
  @JoinColumn()
  worldBuilding: WorldBuilding;

  @Column({ type: 'int' })
  worldBuildingId: number;

  @ManyToOne(() => Item, { nullable: true, eager: false })
  @Field(() => Item, { nullable: true })
  outputItem: Item | null;

  @Column({ type: 'int', nullable: true })
  outputItemId: number | null;

  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  progressTicks: number;
}
