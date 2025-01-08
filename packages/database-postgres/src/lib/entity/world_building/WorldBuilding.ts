import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Building } from '../building/Building';
import { World } from '../world/World';
import { WorldBuildingInventory } from '../world_building_inventory/WorldBuildingInventory';

import { DBWorldBuilding } from '@virtcon2/static-game-data';
import { RedisPubSub } from 'graphql-redis-subscriptions';
export const pubsub = new RedisPubSub();

@ObjectType()
@Entity()
export class WorldBuilding extends BaseEntity implements DBWorldBuilding {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number;

  @Field(() => World)
  @ManyToOne(() => World, (world) => world.id)
  world: World;

  @Column({ type: 'varchar' })
  worldId: string;

  @ManyToOne(() => Building, (building) => building.id, { nullable: true })
  @Field(() => Building)
  building: Building;
  @Column({ type: 'int', nullable: true })
  buildingId: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  x: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  y: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  rotation: number;

  @Field(() => [WorldBuildingInventory], { nullable: true })
  @OneToMany(() => WorldBuildingInventory, (wbi) => wbi.world_building, { nullable: true })
  world_building_inventory: WorldBuildingInventory[];

  /* Outputs into building */
  @Field(() => WorldBuilding, { nullable: true })
  @ManyToOne(() => WorldBuilding, (wb) => wb.id, { nullable: true })
  output_world_building: WorldBuilding;
  @Column({ type: 'int', nullable: true })
  outputWorldBuildingId: number;

  @Field(() => Boolean)
  @Column({ type: 'boolean', default: false })
  active: boolean;
}
