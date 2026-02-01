import { log, LogApp, LogLevel } from '@shared';
import { defineQuery, removeEntity } from '@virtcon2/bytenetc';
import { AppDataSource, publishUserInventoryUpdate, UserInventoryItem, WorldBuilding, WorldResource } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestPickupBuildingPacketData } from '@virtcon2/network-packet';
import { Building, Position } from '@virtcon2/network-world-entities';
import { syncRemoveEntities } from '../enqueue';
import { inventoryQueue } from '../inventoryQueue';

export default async function requestPickupBuildingPacket(packet: ClientPacketWithSender<RequestPickupBuildingPacketData>) {
  const player_id = packet.sender.id;
  const worldBuildingId = packet.data.worldBuildingId;

  // Fetch WorldBuilding with all necessary relations
  const worldBuilding = await WorldBuilding.findOne({
    where: { id: worldBuildingId, world: { id: packet.world_id } },
    relations: ['building', 'building.item', 'world_building_inventory', 'world_building_inventory.item'],
  });

  if (!worldBuilding) {
    log(`Player ${player_id} tried to pick up building ${worldBuildingId} but it was not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);

    throw new Error(`WorldBuilding with id ${worldBuildingId} not found`);
  }

  // Count occupied building inventory slots
  const occupiedSlots = worldBuilding.world_building_inventory.filter((slot) => slot.itemId !== null && slot.quantity > 0);
  const totalSlotsNeeded = 1 + occupiedSlots.length; // 1 for building + occupied slots

  // Count empty player inventory slots
  const playerInventory = await UserInventoryItem.find({
    where: { user: { id: player_id } },
    order: { slot: 'ASC' },
  });

  const emptySlots = playerInventory.filter((slot) => slot.itemId === null);

  if (emptySlots.length < totalSlotsNeeded) {
    log(
      `Player ${player_id} tried to pick up building ${worldBuildingId} but has insufficient inventory space (need ${totalSlotsNeeded}, have ${emptySlots.length})`,
      LogLevel.WARN,
      LogApp.PACKET_DATA_SERVER,
    );

    throw new Error('Insufficient inventory space to pick up building and its contents.');
  }

  // Find building entity in ECS
  const buildingQuery = defineQuery(Building, Position);
  const buildingEntities = buildingQuery(packet.world_id);

  let buildingEntityId: number | null = null;
  for (let i = 0; i < buildingEntities.length; i++) {
    const eid = buildingEntities[i];
    if (Building(packet.world_id).worldBuildingId[eid] === worldBuildingId) {
      buildingEntityId = eid;
      break;
    }
  }

  if (buildingEntityId === null) {
    log(`Building entity not found in ECS for worldBuildingId ${worldBuildingId}`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  // Remove building entity from ECS and broadcast removal
  removeEntity(packet.world_id, buildingEntityId);
  await syncRemoveEntities(packet.world_id, [buildingEntityId]);

  // Database transaction to transfer items and cleanup
  await inventoryQueue.add(async () => {
    await AppDataSource.transaction(async (transaction) => {
      // Transfer each occupied building inventory slot to player
      for (const slot of occupiedSlots) {
        await UserInventoryItem.addToInventory(transaction, player_id, slot.itemId, slot.quantity);
      }

      // Add building item to player inventory
      await UserInventoryItem.addToInventory(transaction, player_id, worldBuilding.building.item.id, 1);

      // Update WorldResource to remove building reference
      const resource = await transaction.findOne(WorldResource, {
        where: { worldBuildingId: worldBuilding.id },
      });

      if (resource) {
        resource.worldBuildingId = null;
        await transaction.save(resource);
      }

      // Delete all WorldBuildingInventory records
      await transaction.remove(worldBuilding.world_building_inventory);

      // Delete WorldBuilding record
      await transaction.remove(worldBuilding);
    });

    // Publish inventory update
    publishUserInventoryUpdate(player_id);
  });

  log(`Player ${player_id} successfully picked up building ${worldBuildingId}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
}
