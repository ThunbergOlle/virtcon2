import { log, LogApp, LogLevel } from '@shared';
import { safelyMoveItemsBetweenInventories, WorldBuilding, WorldBuildingInventory } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, PacketType, RequestWorldBuildingPacket } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import request_world_building_packet from '../packet/packets/request_world_building_packet';
import { SERVER_SENDER } from '../packet/utils';

interface InventoryItemModifiers {
  item_id: number;
  quantity: number;
}

export default async function finishProcessing(worldBuildingId: number, redis: RedisClientType) {
  // get the world building
  const worldBuilding = await WorldBuilding.findOne({
    where: { id: worldBuildingId },
    relations: [
      'world_building_inventory',
      'world_building_inventory.item',
      'world_resource',
      'world_resource.item',
      'output_world_building',
      'building',
      'building.output_item',
      'building.processing_requirements',
      'building.items_to_be_placed_on',
      'world',
    ],
  });

  if (!worldBuilding) {
    log(`World building with id ${worldBuildingId} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  const processingRequirements = worldBuilding.building.processing_requirements;

  const resultingItems: InventoryItemModifiers[] =
    processingRequirements && processingRequirements.length ? await processWithRequirements(worldBuilding) : await processWithoutRequirements(worldBuilding);

  await _addItemsToBuilding(resultingItems, worldBuilding);
  if (worldBuilding.output_world_building) await moveInventoryToOutput(worldBuilding.id);
  // send a packet to the world server to update the world building inventory
  const world_building_packet: ClientPacketWithSender<RequestWorldBuildingPacket> = {
    data: {
      building_id: worldBuilding.id,
    },
    packet_type: PacketType.REQUEST_WORLD_BUILDING,
    sender: SERVER_SENDER,
    packet_target: worldBuilding.world.id,
    world_id: worldBuilding.world.id,
  };
  request_world_building_packet(world_building_packet, redis);
}

async function _addItemsToBuilding(resultingItems: InventoryItemModifiers[], worldBuilding: WorldBuilding) {
  for (let i = 0; i < resultingItems.length; i++) {
    const resulting_item = resultingItems[i];
    await WorldBuildingInventory.addToInventory(worldBuilding.id, resulting_item.item_id, resulting_item.quantity);
  }
  log(`Added items to building ${worldBuilding.id}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
}

async function processWithoutRequirements(world_building: WorldBuilding): Promise<InventoryItemModifiers[]> {
  if (world_building.building.output_item) {
    // this is a building that can "create" an item, for example, a mining building
    return [{ item_id: world_building.building.output_item.id, quantity: world_building.building.output_quantity }];
  } else if (world_building.building.output_quantity > 0 && world_building.building.items_to_be_placed_on.length && world_building.world_resource) {
    return [{ item_id: world_building.world_resource.item.id, quantity: world_building.building.output_quantity }];
  }
  return [];
}

async function processWithRequirements(world_building: WorldBuilding): Promise<InventoryItemModifiers[]> {
  const inventory_items = world_building.world_building_inventory;
  const processing_requirements = world_building.building.processing_requirements;

  const has_required_items = processing_requirements.every((processing_requirement) => {
    const inventory_item = inventory_items.find((inventory_item) => inventory_item.item.id === processing_requirement.item.id);
    return inventory_item && inventory_item.quantity >= processing_requirement.quantity;
  });

  return [];
}

async function moveInventoryToOutput(worldBuildingId: number) {
  const worldBuilding = await WorldBuilding.findOne({
    where: { id: worldBuildingId },
    relations: ['world_building_inventory', 'world_building_inventory.item', 'output_world_building', 'building'],
  });

  if (!worldBuilding.output_world_building) return;

  async function moveItems(capacity_left: number, world_building_inventory: WorldBuildingInventory[]) {
    if (capacity_left < 0) {
      log(`Capacity left is less than 0. Potential quantity leak!`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return;
    }
    if (capacity_left === 0) {
      return;
    }
    const inventory_item_to_be_moved_index = world_building_inventory.findIndex((i) => i.quantity > 0 && i.item);
    const inventory_item_to_be_moved = world_building_inventory[inventory_item_to_be_moved_index];
    if (!inventory_item_to_be_moved) {
      return;
    }
    const quantity_to_be_moved = Math.min(capacity_left, inventory_item_to_be_moved.quantity);

    capacity_left -= quantity_to_be_moved;

    await safelyMoveItemsBetweenInventories({
      fromId: worldBuilding.id,
      fromType: 'building',
      toId: worldBuilding.output_world_building.id,
      toType: 'building',
      itemId: inventory_item_to_be_moved.item.id,
      quantity: quantity_to_be_moved,
    });

    world_building_inventory.splice(inventory_item_to_be_moved_index, 1);

    await moveItems(capacity_left, world_building_inventory);
  }
  await moveItems(worldBuilding.building.inventory_transfer_quantity_per_cycle, worldBuilding.world_building_inventory);
}
