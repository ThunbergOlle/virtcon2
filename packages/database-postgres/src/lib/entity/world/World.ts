import { TILE_LEVEL, TILE_TYPE, WorldSettings, TileType } from '@shared';
import seedRandom from 'seedrandom';
import { createNoise2D } from 'simplex-noise';
import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, BeforeInsert, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { WorldBuilding } from '../world_building/WorldBuilding';
import { WorldPlot } from '../world_plot/WorldPlot';

@ObjectType()
@Entity()
export class World extends BaseEntity {
  @PrimaryColumn({ type: 'text', unique: true })
  @Field(() => String)
  id: string; // world ID is the player's display name

  @Column({ type: 'int', nullable: false })
  @Field(() => Number)
  seed: number;

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
        map[x][y] = noise(x / 50, y / 50);
      }
    }
    return map;
  }

  static getHeightAtPoint(seed: number, x: number, y: number): number {
    const randomGenerator = seedRandom(seed);
    const noise = createNoise2D(randomGenerator);
    return noise(x / 50, y / 50);
  }

  static getTileAtPoint(seed: number, x: number, y: number) {
    const height = World.getHeightAtPoint(seed, x, y);
    const tileType = Object.entries(TILE_LEVEL).reduce((prev, [key, value]) => {
      if (height >= value) return key;

      return prev;
    }, TILE_TYPE.WATER as TileType);

    return tileType as TileType;
  }

  static async GenerateNewWorld(worldId: string): Promise<World> {
    return new Promise((resolve) => {
      AppDataSource.manager.transaction(async (transaction) => {
        const world = World.create({ id: worldId });
        world.seed = Math.floor(Math.random() * 1000000000);

        await transaction.save(world);

        const startPlot = WorldPlot.create({ worldId: worldId, x: 0, y: 0 });

        await transaction.save(startPlot);

        return resolve(world);
      });
    });
  }
}
