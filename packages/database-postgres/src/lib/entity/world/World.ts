import { plotSize, WorldSettings } from '@shared';
import { DBItemName, ResourceNames, shouldGenerateResource } from '@virtcon2/static-game-data';
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

  static async GenerateNewWorld(worldId: string): Promise<World> {
    return new Promise((resolve) => {
      AppDataSource.manager.transaction(async (transaction) => {
        let seed = Math.floor(Math.random() * 1000000000);
        for (;;) {
          let hasTree = false;
          let hasStone = false;
          let hasCoal = false;

          for (let x = 0; x < plotSize; x++) {
            for (let y = 0; y < plotSize; y++) {
              const { shouldSpawn, resource } = shouldGenerateResource(x, y, seed);
              if (!shouldSpawn || !resource) continue;
              if (resource.name === DBItemName.WOOD) hasTree = true;
              else if (resource.name === DBItemName.STONE) hasStone = true;
              else if (resource.name === DBItemName.COAL) hasCoal = true;
            }
          }
          if (hasTree && hasStone && hasCoal) {
            break;
          }
          seed = Math.floor(Math.random() * 1000000000);
        }
        const world = World.create({ id: worldId });
        world.seed = seed;

        await transaction.save(world);

        const startPlot = WorldPlot.create({ worldId: worldId, x: 0, y: 0 });

        await transaction.save(startPlot);

        return resolve(world);
      });
    });
  }
}
