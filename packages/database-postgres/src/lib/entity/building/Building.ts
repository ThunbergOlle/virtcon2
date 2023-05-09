import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { WorldBuilding } from '../world_building/WorldBuilding';
import { DBItemName } from '@virtcon2/static-game-data';

@ObjectType()
@Entity()
export class Building extends BaseEntity {
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

  @OneToMany(() => WorldBuilding, (i) => i.building)
  world_buildings: WorldBuilding[];
}
