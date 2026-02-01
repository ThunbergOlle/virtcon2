import { LogApp, LogLevel, log } from '@shared';
import { UserInventoryItem, WorldBuilding, WorldBuildingInventory, safelyMoveItemsBetweenInventories } from '@virtcon2/database-postgres';
import { WorldBuildingInventorySlotType } from '@virtcon2/static-game-data';
import { ClientPacketWithSender, InventoryType, RequestMoveInventoryItemPacketData } from '@virtcon2/network-packet';

export default async function request_move_inventory_item_packet(packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>) {
  /* Handle differently depending on if items moves between player inventory or building inventory */

  if (packet.data.fromInventoryType === InventoryType.PLAYER && packet.data.toInventoryType === InventoryType.BUILDING) {
    return request_move_inventory_item_to_building(packet);
  } else if (packet.data.fromInventoryType === InventoryType.BUILDING && packet.data.toInventoryType === InventoryType.PLAYER) {
    return request_move_inventory_item_to_player_inventory(packet);
  } else if (packet.data.fromInventoryType === InventoryType.PLAYER && packet.data.toInventoryType === InventoryType.PLAYER) {
    return request_move_inventory_item_inside_player_inventory(packet);
  } else if (packet.data.fromInventoryType === InventoryType.BUILDING && packet.data.toInventoryType === InventoryType.BUILDING) {
    return request_move_inventory_item_inside_building_inventory(packet);
  }

  log(
    `Cannot move item from ${packet.data.fromInventoryType} to ${packet.data.toInventoryType}. This is not supported!`,
    LogLevel.ERROR,
    LogApp.PACKET_DATA_SERVER,
  );
}
async function request_move_inventory_item_inside_building_inventory(packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>) {
  // Get the target building with its building type for slot validation
  const targetBuilding = await WorldBuilding.findOne({
    where: { id: packet.data.toInventoryId },
    relations: ['building', 'world_building_inventory'],
  });

  if (!targetBuilding) {
    log(`Building with id ${packet.data.toInventoryId} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  const processingRequirements = targetBuilding.building?.processing_requirements ?? [];
  const toSlot = packet.data.toInventorySlot;

  // Validate explicit slot placement
  if (toSlot !== undefined) {
    const targetSlot = targetBuilding.world_building_inventory.find((inv) => inv.slot === toSlot);
    if (targetSlot) {
      // Cannot manually place items in OUTPUT slots
      if (targetSlot.slotType === WorldBuildingInventorySlotType.OUTPUT) {
        log(`Cannot manually place items in OUTPUT slot ${toSlot}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
        return;
      }

      // FUEL slots only accept fuel items (items in processing_requirements)
      if (targetSlot.slotType === WorldBuildingInventorySlotType.FUEL) {
        const isFuel = processingRequirements.some((req) => req.item.id === packet.data.inventoryItem.item.id);
        if (!isFuel) {
          log(`Cannot place non-fuel item ${packet.data.inventoryItem.item.id} in FUEL slot ${toSlot}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
          return;
        }
      }
    }
  }

  await safelyMoveItemsBetweenInventories({
    fromId: packet.data.fromInventoryId,
    toId: packet.data.toInventoryId,
    itemId: packet.data.inventoryItem.item.id,
    quantity: packet.data.inventoryItem.quantity,
    fromType: 'building',
    toType: 'building',
    fromSlot: packet.data.fromInventorySlot,
    toSlot,
    processingRequirements,
  });
}
async function request_move_inventory_item_inside_player_inventory(packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>) {
  await safelyMoveItemsBetweenInventories({
    fromId: packet.sender.id,
    toId: packet.sender.id,
    itemId: packet.data.inventoryItem.item.id,
    quantity: packet.data.inventoryItem.quantity,
    fromType: 'user',
    toType: 'user',
    fromSlot: packet.data.fromInventorySlot,
    toSlot: packet.data.toInventorySlot,
    log: true,
  });
}
async function request_move_inventory_item_to_player_inventory(packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>) {
  const building_inventory_item = await WorldBuildingInventory.findOne({
    where: { item: { id: packet.data.inventoryItem.item.id }, world_building: { id: packet.data.fromInventoryId } },
    relations: ['item', 'world_building'],
  });
  if (!building_inventory_item) {
    log(
      `Building ${packet.data.fromInventoryId} does not have item ${packet.data.inventoryItem} but tried to move it from their inventory! Sus 📮`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // get the building
  const building_to_drop_in = await WorldBuilding.findOne({ where: { id: packet.data.fromInventoryId } });
  if (!building_to_drop_in) {
    log(
      `Building with id ${packet.data.fromInventoryId} not found. Cannot move item to inventory that is non-existant`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // remove / add to inventories
  await safelyMoveItemsBetweenInventories({
    fromId: building_to_drop_in.id,
    toId: packet.sender.id,
    itemId: packet.data.inventoryItem.item.id,
    quantity: packet.data.inventoryItem.quantity,
    fromType: 'building',
    toType: 'user',
    fromSlot: packet.data.fromInventorySlot,
    toSlot: packet.data.toInventorySlot,
  });
}

async function request_move_inventory_item_to_building(packet: ClientPacketWithSender<RequestMoveInventoryItemPacketData>) {
  const player_inventory_item = await UserInventoryItem.findOne({
    where: { slot: packet.data.inventoryItem.slot, user: { id: packet.sender.id } },
    relations: ['item'],
  });
  if (!player_inventory_item) {
    log(
      `Player ${packet.sender.id} does not have item ${packet.data.inventoryItem} but tried to move it from their inventory! Sus 📮`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }
  // get the building with its building type for processing_requirements
  const building_to_drop_in = await WorldBuilding.findOne({
    where: { id: packet.data.toInventoryId },
    relations: ['building', 'world_building_inventory'],
  });
  if (!building_to_drop_in) {
    log(
      `Building with id ${packet.data.toInventoryId} not found. Cannot move item to inventory that is non-existant`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  const processingRequirements = building_to_drop_in.building?.processing_requirements ?? [];
  const toSlot = packet.data.toInventorySlot;

  // Validate explicit slot placement
  if (toSlot !== undefined) {
    const targetSlot = building_to_drop_in.world_building_inventory.find((inv) => inv.slot === toSlot);
    if (targetSlot) {
      // Cannot manually place items in OUTPUT slots
      if (targetSlot.slotType === WorldBuildingInventorySlotType.OUTPUT) {
        log(`Cannot manually place items in OUTPUT slot ${toSlot}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
        return;
      }

      // FUEL slots only accept fuel items (items in processing_requirements)
      if (targetSlot.slotType === WorldBuildingInventorySlotType.FUEL) {
        const isFuel = processingRequirements.some((req) => req.item.id === packet.data.inventoryItem.item.id);
        if (!isFuel) {
          log(`Cannot place non-fuel item ${packet.data.inventoryItem.item.id} in FUEL slot ${toSlot}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
          return;
        }
      }
    }
  }

  await safelyMoveItemsBetweenInventories({
    fromId: packet.sender.id,
    toId: building_to_drop_in.id,
    itemId: packet.data.inventoryItem.item.id,
    quantity: packet.data.inventoryItem.quantity,
    fromType: 'user',
    toType: 'building',
    fromSlot: packet.data.fromInventorySlot,
    toSlot,
    processingRequirements,
  });
}
