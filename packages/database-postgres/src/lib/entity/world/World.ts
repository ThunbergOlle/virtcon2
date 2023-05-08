import { WorldSettings } from '@shared';
import seedRandom from 'seedrandom';
import { createNoise2D } from 'simplex-noise';
import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, BeforeInsert, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { Item } from '../item/Item';
import { User } from '../user/User';
import { WorldResource } from '../world_resource/WorldResource';
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

  @Field(() => [WorldResource])
  @OneToMany(() => WorldResource, (worldResource) => worldResource.world)
  resources: WorldResource[];

  @BeforeInsert()
  replaceSpacesInId() {
    this.id = this.id.replace(/\s/g, '_');
  }
  static Get2DWorldMap(seed: number, size = WorldSettings.world_size): number[][] {
    const noise = createNoise2D(() => seed);
    const map = [];
    for (let x = 0; x < size; x++) {
      map[x] = [];
      for (let y = 0; y < size; y++) {
        map[x][y] = noise(x / 10, y / 10);
      }
    }
    return map;
  }
  static async RegenerateWorld(world_id: string, size = WorldSettings.world_size) {
    const world = await World.findOne({ where: { id: world_id } });
    if (!world) {
      throw new Error('World not found');
    }
    // delete all resources
    await WorldResource.delete({ world: { id: world.id } });

    const world_map = World.Get2DWorldMap(world.seed);
    const resources = await World.GenerateResources(world, world_map, world.seed, size);
    for (const resource of resources) {
      await resource.save();
    }
  }
  static async GenerateResources(world: World, world_map: number[][], seed: number, size = WorldSettings.world_size): Promise<Array<WorldResource>> {
    const seededRandom: () => number = seedRandom(seed);
    // spawn resources based on world map
    const resources: Array<WorldResource> = [];
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (const resource of WorldSettings.resource_spawn_rates) {
          if (resource.minHeight <= world_map[x][y] && resource.maxHeight >= world_map[x][y]) {
            const randomSpawnNumber = seededRandom()
            console.log(randomSpawnNumber, resource.spawnRate)
            if (randomSpawnNumber > resource.spawnRate) {
              continue;
            }
            // spawn resource
            const newResource = WorldResource.create();
            const item = await Item.findOne({ where: { id: resource.id } });
            newResource.world = world;
            newResource.x = x;
            newResource.y = y;
            newResource.item = item;
            resources.push(newResource);
          }
        }
      }
    }
    return resources;
  }
  static async GenerateNewWorld(owner: User, size = WorldSettings.world_size): Promise<World> {
    return new Promise((resolve) => {
      AppDataSource.manager.transaction(async (transaction) => {
        const world = World.create();
        world.seed = Math.floor(Math.random() * 1000000000);
        world.id = owner.display_name.replace(/\s/g, '_'); // replace spaces with underscores
        world.resources = [];

        const newWorldWhitelist = WorldWhitelist.create({
          world: world,
          user: owner,
          access_level: AccessLevel.owner,
        });

        await transaction.save(world);
        await transaction.save(newWorldWhitelist);

        const world_map = World.Get2DWorldMap(world.seed, size);
        const resources = await World.GenerateResources(world, world_map, world.seed, size);
        for (const resource of resources) {
          await transaction.save(resource);
        }
        return resolve(world);
      });
    });
  }
}
