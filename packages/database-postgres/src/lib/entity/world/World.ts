import { InvalidStateError, plotSize, WorldSettings } from '@shared';
import {
  DBItemName,
  get_resource_by_item_name,
  ResourceNames,
  Resources,
  shouldGenerateResource,
  shouldGenerateHarvestable,
  Harvestable as HarvestableData,
} from '@virtcon2/static-game-data';
import seedRandom from 'seedrandom';
import { createNoise2D } from 'simplex-noise';
import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, BeforeInsert, Column, Entity, EntityManager, OneToMany, PrimaryColumn } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { WorldBuilding } from '../world_building/WorldBuilding';
import { WorldHarvestable } from '../world_harvestable/WorldHarvestable';
import { WorldPlot } from '../world_plot/WorldPlot';
import { WorldResource } from '../world_resource/WorldResource';

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

  static async GenerateNewWorld(transaction: EntityManager, worldId: string): Promise<World> {
    console.log(`Generating new world with id ${worldId}`);
    let seed = Math.floor(Math.random() * 1000000000);
    for (;;) {
      let hasStone = false;
      let hasCoal = false;

      for (let x = 0; x < plotSize; x++) {
        for (let y = 0; y < plotSize; y++) {
          const { shouldSpawn, resource } = shouldGenerateResource(x, y, seed);
          if (!shouldSpawn || !resource) continue;
          if (resource.name === DBItemName.STONE) hasStone = true;
          else if (resource.name === DBItemName.COAL) hasCoal = true;
        }
      }
      if (hasStone && hasCoal) {
        break;
      }
      seed = Math.floor(Math.random() * 1000000000);
    }

    console.log(`Selected seed ${seed} for world ${worldId}`);

    const world = World.create({ id: worldId });
    world.seed = seed;

    await transaction.save(world);

    for (let x = 0; x < plotSize; x++)
      for (let y = 0; y < plotSize; y++) {
        const { shouldSpawn, resource } = shouldGenerateResource(x, y, seed);
        if (!shouldSpawn) continue;
        if (!resource) throw new InvalidStateError('Resource is undefined despite shouldSpawn being true');
        const resourceData = Resources[resource.resource.name];
        const quantity = Math.floor(
          resource.resource.minDefaultQuantity +
            Math.random() * (resource.resource.maxDefaultQuantity - resource.resource.maxDefaultQuantity + 1),
        );

        const worldResource = WorldResource.create({
          worldId: worldId,
          x: x,
          y: y,
          resourceName: resourceData.name,
          quantity,
        });
        await transaction.save(worldResource);
      }

    // Generate harvestables (trees)
    for (let x = 0; x < plotSize; x++)
      for (let y = 0; y < plotSize; y++) {
        const { shouldSpawn, harvestable } = shouldGenerateHarvestable(x, y, seed);
        if (!shouldSpawn || !harvestable) continue;

        // Skip if there's already a resource at this position
        const existingResource = await transaction.findOne(WorldResource, {
          where: { worldId, x, y },
        });
        if (existingResource) continue;

        const harvestableInfo = HarvestableData[harvestable.name];
        // Create harvestable with max age (12000 for WOOD - fully grown)
        const maxAge = harvestableInfo.states[harvestableInfo.states.length - 1]?.age ?? 12000;

        const worldHarvestable = WorldHarvestable.create({
          worldId: worldId,
          x: x,
          y: y,
          harvestableName: harvestable.name,
          age: maxAge,
        });
        await transaction.save(worldHarvestable);
      }

    const startPlot = WorldPlot.create({ worldId: worldId, x: 0, y: 0 });

    await transaction.save(startPlot);

    console.log(`Generated new world with id ${worldId} and seed ${seed}`);

    return world;
  }
}
