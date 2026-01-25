import { ResourceNames } from '@virtcon2/static-game-data';
import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { World } from '../world/World';
import { WorldBuilding } from '../world_building/WorldBuilding';

@ObjectType()
@Entity()
export class WorldResource extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  @Field(() => Int)
  id: number;

  @Field(() => World)
  @ManyToOne(() => World, (world) => world.id)
  world: World;

  @Column({ type: 'varchar' })
  worldId: string;

  @Column({ type: 'varchar', nullable: false })
  resourceName: ResourceNames;

  @OneToOne(() => WorldBuilding, (wb) => wb.id, { nullable: true })
  @Field(() => WorldBuilding, { nullable: true })
  worldBuilding: WorldBuilding | null;
  @Column({ type: 'int', nullable: true })
  worldBuildingId: number | null;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  x: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  y: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  quantity: number;
}
