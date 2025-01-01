import { WorldSettings } from '@shared';
import { all_spawnable_db_items } from '@virtcon2/static-game-data';
import seedRandom from 'seedrandom';
import { createNoise2D } from 'simplex-noise';
import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, BeforeInsert, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { Item } from '../item/Item';
import { User } from '../user/User';
import { WorldBuilding } from '../world_building/WorldBuilding';
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

  static async RegenerateWorld(world_id: string, size = WorldSettings.world_size) {
    const world = await World.findOne({ where: { id: world_id } });
    if (!world) {
      throw new Error('World not found');
    }
    await WorldBuilding.update({ world: { id: world.id } }, { world_resource: null });
    // delete all resources
    await WorldResource.delete({ world: { id: world.id } });

    const world_map = World.Get2DWorldMap(world.seed);
    const resources = await World.GenerateResources(world, world_map, world.seed, size);
    for (const resource of resources) {
      await resource.save();
    }
  }
  static async GenerateResources(
    world: World,
    world_map: number[][],
    seed: number,
    size = WorldSettings.world_size,
  ): Promise<Array<WorldResource>> {
    const seededRandom: () => number = seedRandom(seed);
    // this will make some resources are more likely to spawn if they are higher in the array
    const shuffled_spawnable_resources = all_spawnable_db_items.sort(() => 0.5 - seededRandom());
    // spawn resources based on world map
    const resources: Array<WorldResource> = [];
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        spawnable_resources_loop: for (const item of shuffled_spawnable_resources) {
          const tileHeight = world_map[x][y];
          if (tileHeight >= item.spawnSettings.minHeight && tileHeight <= item.spawnSettings.maxHeight) {
            const randomSpawnNumber = seededRandom();
            if (randomSpawnNumber > item.spawnSettings.chance) {
              continue;
            }
            // spawn resource
            const newResource = WorldResource.create();
            const db_item = await Item.findOne({ where: { id: item.id } });
            newResource.world = world;
            newResource.x = x;
            newResource.y = y;
            newResource.item = db_item;
            resources.push(newResource);

            break spawnable_resources_loop;
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
