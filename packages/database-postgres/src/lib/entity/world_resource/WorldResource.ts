import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../item/Item';
import { World } from '../world/World';
import { WorldBuilding } from '../world_building/WorldBuilding';

@ObjectType()
@Entity()
export class WorldResource extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Field(() => Number)
  @Column({ type: 'int' })
  x: number;

  @Field(() => Number)
  @Column({ type: 'int' })
  y: number;

  @ManyToOne(() => Item, (item) => item.id)
  @Field(() => Item)
  item: Item;

  @Column({ type: 'int' })
  itemId: number;

  @Field(() => World)
  @ManyToOne(() => World, (world) => world.id)
  world: World;

  @OneToOne(() => WorldBuilding, { nullable: true })
  @JoinColumn()
  world_building: WorldBuilding | null;

  @Column({ type: 'int', nullable: true })
  worldBuildingId: number;
}
