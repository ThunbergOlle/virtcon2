import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Building } from '../building/Building';
import { WorldResource } from '../world_resource/WorldResource';
import { WorldBuildingInventory } from '../world_building_inventory/WorldBuildingInventory';

@ObjectType()
@Entity()
export class WorldBuilding extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Field(() => String)
  id: string;

  @ManyToOne(() => Building, (building) => building.id)
  @Field(() => Building)
  building: Building;

  @OneToOne(() => WorldResource)
  @Field(() => WorldResource)
  @JoinColumn()
  world_resource: WorldResource;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  x: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  y: number;

  @Field(() => [WorldBuildingInventory])
  @OneToMany(() => WorldBuildingInventory, (wbi) => wbi.world_building)
  world_building_inventory: WorldBuildingInventory[];

  /* Outputs into building */
  @Field(() => WorldBuilding, { nullable: true })
  @OneToOne(() => WorldBuilding, (wb) => wb.id, { nullable: true })
  @JoinColumn()
  outputWorldBuilding: WorldBuilding;
}
