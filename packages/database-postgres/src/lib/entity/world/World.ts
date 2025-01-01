import { WorldSettings } from '@shared';
import seedRandom from 'seedrandom';
import { createNoise2D } from 'simplex-noise';
import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, BeforeInsert, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { User } from '../user/User';
import { WorldBuilding } from '../world_building/WorldBuilding';
import { AccessLevel, WorldWhitelist } from '../world_whitelist/WorldWhitelist';

@ObjectType()
@Entity()
export class World extends BaseEntity {
  @PrimaryColumn({ type: 'text', unique: true })
  @Field(() => String)
  id: string; // world ID is the player's display name

  @Column({ type: 'int', nullable: false })
  @Field(() => Number)
  seed: number;

  @Field(() => [WorldWhitelist])
  @OneToMany(() => WorldWhitelist, (worldWhitelist) => worldWhitelist.world)
  whitelist: string;

  @Field(() => [WorldBuilding])
  @OneToMany(() => WorldBuilding, (building) => building.world)
  buildings: WorldBuilding[];

  @BeforeInsert()
  replaceSpacesInId() {
    this.id = this.id.replace(/\s/g, '_');
  }
  static Get2DWorldMap(seed: number, size = WorldSettings.world_size): number[][] {
    const randomGenerator = seedRandom(seed);
    const noise = createNoise2D(randomGenerator);
    const map = [];
    for (let x = 0; x < size; x++) {
      map[x] = [];
      for (let y = 0; y < size; y++) {
        map[x][y] = noise(x / 20, y / 20);
      }
    }
    return map;
  }

  static getHeightAtPoint(seed: number, x: number, y: number): number {
    const randomGenerator = seedRandom(seed);
    const noise = createNoise2D(randomGenerator);
    return noise(x / 20, y / 20);
  }

  static async GenerateNewWorld(owner: User, size = WorldSettings.world_size): Promise<World> {
    return new Promise((resolve) => {
      AppDataSource.manager.transaction(async (transaction) => {
        const world = World.create();
        world.seed = Math.floor(Math.random() * 1000000000);
        world.id = owner.display_name.replace(/\s/g, '_'); // replace spaces with underscores

        const newWorldWhitelist = WorldWhitelist.create({
          world: world,
          user: owner,
          access_level: AccessLevel.owner,
        });

        await transaction.save(world);
        await transaction.save(newWorldWhitelist);

        return resolve(world);
      });
    });
  }
}
