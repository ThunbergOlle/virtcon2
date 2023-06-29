import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { UserInventoryItem } from '../user_inventory_item/UserInventoryItem';
import { DBItemName } from '@virtcon2/static-game-data';
import { ItemRecipe } from '../item_recipe/ItemRecipe';
import { Building } from '../building/Building';

@ObjectType()
@Entity()
export class Item extends BaseEntity {
  @PrimaryColumn({ type: 'int', unique: true })
  @Field(() => Int)
  id: number;

  @Field(() => String)
  @Column({ type: 'text' })
  name: string;

  @Field(() => String)
  @Column({ type: 'text' })
  display_name: DBItemName;

  @Field(() => String)
  @Column({ type: 'text' })
  description: string;

  @Field(() => String)
  @Column({ type: 'text' })
  icon: string;

  @Field(() => String)
  @Column({ type: 'text' })
  rarity: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 64 })
  stack_size: number;

  @OneToMany(() => UserInventoryItem, (i) => i.item)
  inventory: UserInventoryItem[];

  @Field(() => [ItemRecipe])
  @OneToMany(() => ItemRecipe, (i) => i.resultingItem, { nullable: true })
  recipe: ItemRecipe[];

  /* IsBuilding */
  @Field(() => Boolean)
  @Column({ type: 'boolean', default: false })
  is_building: boolean;

  /* Building relationship */
  @Field(() => Building, { nullable: true })
  @OneToOne(() => Building, (b) => b.item, { nullable: true })
  building: Building;
}
