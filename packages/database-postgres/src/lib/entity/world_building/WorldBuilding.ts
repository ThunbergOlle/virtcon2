import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Building } from '../building/Building';
import { WorldResource } from '../world_resource/WorldResource';
import { WorldBuildingInventory } from '../world_building_inventory/WorldBuildingInventory';
import { World } from '../world/World';

@ObjectType()
@Entity()
export class WorldBuilding extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Field(() => String)
  id: string;

  @Field(() => World)
  @ManyToOne(() => World, (world) => world.id)
  world: World;

  @ManyToOne(() => Building, (building) => building.id)
  @Field(() => Building)
  building: Building;

  @OneToOne(() => WorldResource, { nullable: true })
  @Field(() => WorldResource)
  @JoinColumn()
  world_resource: WorldResource;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  x: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  y: number;

  @Field(() => [WorldBuildingInventory], {nullable: true})
  @OneToMany(() => WorldBuildingInventory, (wbi) => wbi.world_building, {nullable: true})
  world_building_inventory: WorldBuildingInventory[];

  /* Outputs into building */
  @Field(() => WorldBuilding, { nullable: true })
  @OneToOne(() => WorldBuilding, (wb) => wb.id, { nullable: true })
  @JoinColumn()
  output_world_building: WorldBuilding;

  @Field(() => Boolean)
  @Column({ type: 'boolean', default: false })
  active: boolean;

}
