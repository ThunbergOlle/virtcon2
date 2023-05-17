import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../item/Item';
import { WorldBuilding } from '../world_building/WorldBuilding';

@ObjectType()
@Entity()
export class WorldBuildingInventory extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Field(() => String)
  id: string;

  @ManyToOne(() => WorldBuilding, (wb) => wb.id)
  @Field(() => WorldBuilding)
  world_building: WorldBuilding;

  /* Item  */
  @ManyToOne(() => Item)
  @Field(() => Item)
  item: Item;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  quantity: number;
}
