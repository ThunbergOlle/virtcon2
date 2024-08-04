import { Field, Float, Int, ObjectType } from 'type-graphql';
import { AfterInsert, AfterUpdate, BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Building } from '../building/Building';
import { World } from '../world/World';
import { WorldBuildingInventory } from '../world_building_inventory/WorldBuildingInventory';
import { WorldResource } from '../world_resource/WorldResource';

import { DBWorldBuilding } from '@virtcon2/static-game-data';
import { RedisPubSub } from 'graphql-redis-subscriptions';
export const pubsub = new RedisPubSub();

export const TOPIC_BUILDING_UPDATE = 'BUILDING_UPDATE';

@ObjectType()
@Entity()
export class WorldBuilding extends BaseEntity implements DBWorldBuilding {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number;

  @Field(() => World)
  @ManyToOne(() => World, (world) => world.id)
  world: World;

  @ManyToOne(() => Building, (building) => building.id)
  @Field(() => Building)
  building: Building;
  buildingId: number;

  @OneToOne(() => WorldResource, { nullable: true })
  @Field(() => WorldResource, { nullable: true })
  @JoinColumn()
  world_resource: WorldResource;
  worldResourceId: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  x: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  y: number;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 }) // rotation in radians
  rotation: number;

  @Field(() => [WorldBuildingInventory], { nullable: true })
  @OneToMany(() => WorldBuildingInventory, (wbi) => wbi.world_building, { nullable: true })
  world_building_inventory: WorldBuildingInventory[];

  /* Outputs into building */
  @Field(() => WorldBuilding, { nullable: true })
  @ManyToOne(() => WorldBuilding, (wb) => wb.id, { nullable: true })
  output_world_building: WorldBuilding;
  outputWorldBuildingId: number;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  output_pos_x: number;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  output_pos_y: number;

  @Field(() => Boolean)
  @Column({ type: 'boolean', default: false })
  active: boolean;

  @AfterInsert()
  @AfterUpdate()
  async publishUpdate() {
    pubsub.publish(`${TOPIC_BUILDING_UPDATE}.${this.id}`, this);
  }
}
