import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Item } from '../item/Item';
import { Building } from '../building/Building';

@ObjectType()
@Entity()
export class BuildingFuelRequirement extends BaseEntity {
  @Field(() => Int)
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Field(() => Item)
  @ManyToOne(() => Item, (Item) => Item.id, { nullable: false })
  item: Item;

  @Field(() => Int)
  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => Building, (building) => building.id, { nullable: false })
  building: Building;

}
