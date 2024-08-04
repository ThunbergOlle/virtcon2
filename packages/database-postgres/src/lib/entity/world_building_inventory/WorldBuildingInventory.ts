import { Field, Int, ObjectType } from 'type-graphql';
import { AfterInsert, AfterUpdate, BaseEntity, BeforeUpdate, Column, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { addToInventory } from '../../shared/InventoryManagement';
import { Item } from '../item/Item';
import { TOPIC_BUILDING_UPDATE, WorldBuilding } from '../world_building/WorldBuilding';
import { LogApp, LogLevel, log } from '@shared';
import { RedisPubSub } from 'graphql-redis-subscriptions';

const pubsub = new RedisPubSub();
@ObjectType()
@Entity()
export class WorldBuildingInventory extends BaseEntity {
  @PrimaryColumn({ type: 'int' })
  worldBuildingId: number;

  @Field(() => WorldBuilding)
  @ManyToOne(() => WorldBuilding, (wb) => wb.id, {})
  world_building: WorldBuilding;

  @Field(() => Int)
  @PrimaryColumn({ type: 'int' })
  slot: number;

  /* Item  */
  @ManyToOne(() => Item, { nullable: true })
  @Field(() => Item, { nullable: true })
  item: Item;

  @Column({ type: 'int', nullable: true })
  itemId: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  quantity: number;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @BeforeUpdate()
  async updateDates() {
    const updatedAt = this.updatedAt;
    const latest = await WorldBuildingInventory.findOne({ where: { worldBuildingId: this.worldBuildingId, slot: this.slot } });
    if (latest) {
      if (Number(latest.updatedAt) !== Number(updatedAt)) {
        log(`Inventory slot ${this.slot} was updated by someone else`, LogLevel.ERROR);
        log(`Objects: ${JSON.stringify(latest)} ${JSON.stringify(this)}`, LogLevel.ERROR);
        log(
          `Newest: ${latest.updatedAt.toISOString()} Outdated: ${updatedAt.toISOString()} Current time: ${new Date().toISOString()}`,
          LogLevel.ERROR,
          LogApp.DATABASE_POSTGRES,
        );
      }
    }
  }

  @AfterInsert()
  @AfterUpdate()
  async publishUpdate() {
    pubsub.publish(`${TOPIC_BUILDING_UPDATE}.${this.worldBuildingId}`, { id: this.worldBuildingId });
  }

  // returns remainder of quantity that could not be added
  static async addToInventory(worldBuildingId: number, itemId: number, quantity: number, slot?: number): Promise<number> {
    if (quantity === 0) {
      log('Quantity is 0, nothing to add', LogLevel.INFO);
      return 0;
    }
    const world_building_inventory_slots = await WorldBuildingInventory.find({
      where: { world_building: { id: worldBuildingId } },
      relations: ['item'],
      order: { slot: 'ASC' },
    });

    return await addToInventory(world_building_inventory_slots, itemId, quantity, slot);
  }
}
