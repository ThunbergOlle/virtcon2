import { LogApp, LogLevel, log } from '@shared';
import { WorldBuilding, WorldBuildingInventory, safe_move_items_between_inventories } from '@virtcon2/database-postgres';
import {
  InternalWorldBuildingFinishedProcessing,
  NetworkPacketData,
  NetworkPacketDataWithSender,
  PacketType,
  RequestWorldBuildingPacket,
} from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import request_world_building_packet from './request_world_building_packet';

export default async function internal_world_building_finished_processing_packet(
  packet: NetworkPacketData<InternalWorldBuildingFinishedProcessing>,
  redisPubClient: RedisClientType,
) {
  // this packet is trusted and sent by the tick server.
  const world_building_id = packet.data.world_building_id;

  // get the world building
  const world_building = await WorldBuilding.findOne({
    where: { id: world_building_id },
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

  if (!world_building) {
    log(`World building with id ${world_building_id} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  const processing_requirements = world_building.building.processing_requirements;

  const resulting_items: InventoryItemModifiers[] =
    processing_requirements && processing_requirements.length
      ? await handle_building_with_processing_requirements(world_building)
      : await handle_building_with_no_processing_requirements(world_building);

  await handle_resulting_items(resulting_items, world_building);
  if (world_building.output_world_building) await handle_move_inventory_to_output(world_building.id);
  // send a packet to the world server to update the world building inventory
  const world_building_packet: NetworkPacketDataWithSender<RequestWorldBuildingPacket> = {
    data: {
      building_id: world_building.id,
    },
    packet_type: PacketType.REQUEST_WORLD_BUILDING,
    packet_sender: {
      id: 'server',
      name: '',
      position: [0, 0],
      inventory: [],
      socket_id: '',
      world_id: '',
    },
    world_id: world_building.world.id,
  };
  request_world_building_packet(world_building_packet, redisPubClient);
}
async function handle_move_inventory_to_output(world_building_id: number) {
  // get the world building
  const world_building = await WorldBuilding.findOne({
    where: { id: world_building_id },
    relations: ['world_building_inventory', 'world_building_inventory.item', 'output_world_building', 'building'],
  });

  if (!world_building.output_world_building) return;

  async function move_items(capacity_left: number, world_building_inventory: WorldBuildingInventory[]) {
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

    await safe_move_items_between_inventories({
      fromId: world_building.id,
      fromType: 'building',
      toId: world_building.output_world_building.id,
      toType: 'building',
      itemId: inventory_item_to_be_moved.item.id,
      quantity: quantity_to_be_moved,
    });

    world_building_inventory.splice(inventory_item_to_be_moved_index, 1);

    await move_items(capacity_left, world_building_inventory);
  }
  await move_items(world_building.building.inventory_transfer_quantity_per_cycle, world_building.world_building_inventory);
}
async function handle_resulting_items(resulting_items: InventoryItemModifiers[], world_building: WorldBuilding) {
  for (let i = 0; i < resulting_items.length; i++) {
    const resulting_item = resulting_items[i];
    await WorldBuildingInventory.addToInventory(world_building.id, resulting_item.item_id, resulting_item.quantity);
  }
}
interface InventoryItemModifiers {
  item_id: number;
  quantity: number;
}
async function handle_building_with_no_processing_requirements(world_building: WorldBuilding): Promise<InventoryItemModifiers[]> {
  if (world_building.building.output_item) {
    // this is a building that can "create" an item, for example, a mining building
    return [{ item_id: world_building.building.output_item.id, quantity: world_building.building.output_quantity }];
  } else if (world_building.building.output_quantity > 0 && world_building.building.items_to_be_placed_on.length && world_building.world_resource) {
    return [{ item_id: world_building.world_resource.item.id, quantity: world_building.building.output_quantity }];
  }
  return [];
}
async function handle_building_with_processing_requirements(world_building: WorldBuilding): Promise<InventoryItemModifiers[]> {
  const inventory_items = world_building.world_building_inventory;
  const processing_requirements = world_building.building.processing_requirements;

  const has_required_items = processing_requirements.every((processing_requirement) => {
    const inventory_item = inventory_items.find((inventory_item) => inventory_item.item.id === processing_requirement.item.id);
    return inventory_item && inventory_item.quantity >= processing_requirement.quantity;
  });

  return [];
}
