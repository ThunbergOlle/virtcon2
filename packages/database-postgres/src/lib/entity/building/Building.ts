import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { Item } from '../item/Item';
import { WorldBuilding } from '../world_building/WorldBuilding';
import { TPS } from '@shared';

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

  @OneToMany(() => WorldBuilding, (i) => i.building)
  world_buildings: WorldBuilding[];

  /* What item it can be placed on */
  @Field(() => Item, { nullable: true })
  @OneToOne(() => Item, (i) => i.id, { nullable: true })
  @JoinColumn()
  item_to_be_placed_on: Item;

  /* Processing time in ticks*/
  @Field(() => Int, { nullable: false, defaultValue: TPS * 5 })
  @Column({ type: 'int', default: TPS * 5 })
  processing_ticks: number;

  // width and height in tiles
  @Field(() => Int, { nullable: false, defaultValue: 1 })
  @Column({ type: 'int', default: 1 })
  width: number;

  @Field(() => Int, { nullable: false, defaultValue: 1 })
  @Column({ type: 'int', default: 1 })
  height: number;

}
