import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { Item } from '../item/Item';
import { WorldBuilding } from '../world_building/WorldBuilding';
import { TPS } from '@shared';
import { BuildingProcessingRequirement } from '../building_processing_requirement/BuildingProcessingRequirement';

@ObjectType()
@Entity()
export class Building extends BaseEntity {
  @PrimaryColumn({ type: 'int', unique: true })
  @Field(() => Int)
  id: number;

  @Field(() => String)
  @Column({ type: 'varchar', unique: true })
  name: string;

  /* Item relationship */
  @Field(() => Item, { nullable: false })
  @OneToOne(() => Item, (i) => i.id, { nullable: false })
  @JoinColumn()
  item: Item;

  /* What item it outputs */
  @Field(() => Item, { nullable: true })
  @ManyToOne(() => Item, (i) => i.id, { nullable: true })
  output_item: Item | null;

  // Output quantity
  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  output_quantity: number | null;

  // Output quantity
  @Field(() => Int, { nullable: false, defaultValue: 5 })
  @Column({ type: 'int', nullable: false, default: 5 })
  inventory_transfer_quantity_per_cycle: number;

  @Field(() => Int, { nullable: false, defaultValue: 5 })
  @Column({ type: 'int', nullable: false, default: 5 })
  inventory_slots: number;

  @OneToMany(() => WorldBuilding, (i) => i.building)
  world_buildings: WorldBuilding[];

  /* What item it can be placed on */
  @Field(() => [Item], { nullable: true, defaultValue: [] })
  @ManyToMany(() => Item, { nullable: true, cascade: true })
  @JoinTable()
  items_to_be_placed_on: Item[];

  /* Processing time in ticks*/
  @Field(() => Int, { nullable: false, defaultValue: TPS * 5 })
  @Column({ type: 'int', default: TPS * 5 })
  processing_ticks: number;

  @OneToMany(() => BuildingProcessingRequirement, (i) => i.building, { nullable: true })
  @Field(() => [BuildingProcessingRequirement], { nullable: true, defaultValue: [] })
  processing_requirements: BuildingProcessingRequirement[];

  // width and height in tiles
  @Field(() => Int, { nullable: false, defaultValue: 1 })
  @Column({ type: 'int', default: 1 })
  width: number;

  @Field(() => Int, { nullable: false, defaultValue: 1 })
  @Column({ type: 'int', default: 1 })
  height: number;

  @Field(() => Boolean, { nullable: false, defaultValue: false })
  @Column({ type: 'boolean', default: false })
  is_rotatable: boolean;
}
