import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Building } from '../building/Building';
import { WorldResource } from '../world_resource/WorldResource';

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
}
