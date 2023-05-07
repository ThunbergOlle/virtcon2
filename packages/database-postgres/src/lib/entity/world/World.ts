import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, BeforeInsert, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { WorldWhitelist } from '../world_whitelist/WorldWhitelist';

@ObjectType()
@Entity()
export class World extends BaseEntity {
  @PrimaryColumn({ type: 'text', unique: true })
  @Field(() => String)
  id: string; // world ID is the player's display name

  @Field(() => [WorldWhitelist])
  @OneToMany(() => WorldWhitelist, (worldWhitelist) => worldWhitelist.world)
  whitelist: string;

  @BeforeInsert()
  replaceSpacesInId() {
    this.id = this.id.replace(/\s/g, '_');
  }
}
