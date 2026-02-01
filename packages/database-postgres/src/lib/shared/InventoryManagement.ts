import { LogLevel, log } from '@shared';
import { publishUserInventoryUpdate, UserInventoryItem } from '../entity/user_inventory_item/UserInventoryItem';
import { publishWorldBuildingUpdate, WorldBuildingInventory } from '../entity/world_building_inventory/WorldBuildingInventory';
import { EntityManager } from 'typeorm';
import { AppDataSource } from '../data-source';
import { all_db_items, DBBuildingProcessingRequirement, DBBuildingFuelRequirement, WorldBuildingInventorySlotType } from '@virtcon2/static-game-data';

export enum InventoryOperationType {
  PRODUCTION_OUTPUT, // Production output → OUTPUT slots only
  TRANSFER_TO_BUILDING, // Transfers → FUEL (if fuel) or INPUT
  FUEL_CONSUMPTION, // Remove fuel → FUEL slots only
  INPUT_CONSUMPTION, // Remove materials → INPUT slots only
}

export async function addToInventory(
  transaction: EntityManager,
  inventorySlots: (WorldBuildingInventory | UserInventoryItem)[],
  itemId: number,
  quantity: number,
  slot?: number,
): Promise<number> {
  const { stack_size } = all_db_items.find((i) => i.id === itemId);
  if (quantity < 0) return handleNegativeQuantities(transaction, inventorySlots, itemId, quantity, slot);

  if (slot !== undefined) {
    log(`Adding ${quantity} of item ${itemId} to slot ${slot}`, LogLevel.INFO);
    // check if slot is occupied
    const slot_item = inventorySlots.find((i) => i.slot === slot);
    if (!slot_item) {
      log(`Slot ${slot} cannot be found in inventory`, LogLevel.ERROR);
      return quantity;
    }
    if (slot_item && !slot_item.itemId) return createNewStack(transaction, inventorySlots, itemId, quantity, slot);

    if (slot_item.itemId !== itemId) return quantity;

    // add the item to the slot
    const new_quantity = Math.min(slot_item.quantity + quantity, stack_size);
    const remainder = Math.max(quantity - (stack_size - slot_item.quantity), 0);
    slot_item.quantity = new_quantity;

    await transaction.save(slot_item);
    return remainder;
  }

  const similiar_inventory_stack = inventorySlots.filter((i) => i.itemId === itemId);
  const empty_inventory_slots = inventorySlots.filter((i) => i.itemId === null);
  const stack_with_space = similiar_inventory_stack.find((i) => i.quantity < stack_size);

  // create a new stack if we have space and if we need to.
  if (!stack_with_space && empty_inventory_slots.length) return createNewStack(transaction, empty_inventory_slots, itemId, quantity, slot);

  // if there is a stack with space, add to it
  if (stack_with_space) {
    const new_quantity = Math.min(stack_with_space.quantity + quantity, stack_size);
    const remainder = Math.max(quantity - (stack_size - stack_with_space.quantity), 0);
    stack_with_space.quantity = new_quantity;
    await transaction.save(stack_with_space);
    return remainder;
  }

  return quantity;
}

/**
 * Adds items to a building inventory with slot type enforcement.
 * - PRODUCTION_OUTPUT: Only uses OUTPUT slots
 * - TRANSFER_TO_BUILDING: Uses FUEL slots for fuel items, INPUT slots otherwise
 * - FUEL_CONSUMPTION: Only uses FUEL slots (for removing fuel)
 * - INPUT_CONSUMPTION: Only uses INPUT slots (for removing materials)
 */
export async function addToBuildingInventory(options: {
  transaction: EntityManager;
  inventorySlots: WorldBuildingInventory[];
  itemId: number;
  quantity: number;
  operationType: InventoryOperationType;
  processingRequirements?: DBBuildingProcessingRequirement[];
  fuelRequirements?: DBBuildingFuelRequirement[];
  slot?: number;
}): Promise<number> {
  const { transaction, inventorySlots, itemId, quantity, operationType, processingRequirements, fuelRequirements, slot } = options;

  // Filter slots based on operation type
  let allowedSlots: WorldBuildingInventory[];

  switch (operationType) {
    case InventoryOperationType.PRODUCTION_OUTPUT:
      allowedSlots = inventorySlots.filter((s) => s.slotType === WorldBuildingInventorySlotType.OUTPUT);
      break;

    case InventoryOperationType.FUEL_CONSUMPTION:
      allowedSlots = inventorySlots.filter((s) => s.slotType === WorldBuildingInventorySlotType.FUEL);
      break;

    case InventoryOperationType.INPUT_CONSUMPTION:
      allowedSlots = inventorySlots.filter((s) => s.slotType === WorldBuildingInventorySlotType.INPUT);
      break;

    case InventoryOperationType.TRANSFER_TO_BUILDING: {
      // Check if item is a fuel (in fuel_requirements)
      const isFuel = fuelRequirements?.some((req) => req.item.id === itemId) ?? false;
      if (isFuel) {
        allowedSlots = inventorySlots.filter((s) => s.slotType === WorldBuildingInventorySlotType.FUEL);
      } else {
        // Non-fuel items go to INPUT slots
        allowedSlots = inventorySlots.filter((s) => s.slotType === WorldBuildingInventorySlotType.INPUT);
      }
      break;
    }

    default:
      allowedSlots = inventorySlots;
  }

  if (allowedSlots.length === 0) {
    log(`No valid slots for operation ${InventoryOperationType[operationType]} with item ${itemId}`, LogLevel.INFO);
    return quantity;
  }

  return addToInventory(transaction, allowedSlots, itemId, quantity, slot);
}

async function createNewStack(
  transaction: EntityManager,
  empty_inventory_slots: (WorldBuildingInventory | UserInventoryItem)[],
  itemId: number,
  quantity: number,
  preferred_slot?: number,
): Promise<number> {
  const slot = preferred_slot !== undefined ? empty_inventory_slots.find((s) => s.slot === preferred_slot) : empty_inventory_slots[0];
  slot.itemId = itemId;
  slot.quantity = quantity;

  await transaction.save(slot);
  return quantity - slot.quantity;
}

async function handleNegativeQuantities(
  transaction: EntityManager,
  inventorySlots: (WorldBuildingInventory | UserInventoryItem)[],
  itemId: number,
  quantity: number,
  slot?: number,
): Promise<number> {
  if (slot) {
    log(`Removing ${quantity} of item ${itemId} from slot ${slot}`, LogLevel.INFO);
    // check if slot is occupied
    const slot_item = inventorySlots.find((i) => i.slot === slot && i.itemId === itemId);
    if (!slot_item) {
      log(`Slot ${slot} cannot be found in inventory`, LogLevel.ERROR);
      return quantity;
    }

    // remove the item from the slot
    const new_quantity = slot_item.quantity + quantity;

    slot_item.quantity = new_quantity <= 0 ? 0 : new_quantity;

    if (slot_item.quantity === 0) {
      slot_item.item = null;
      slot_item.itemId = null;
    }

    await transaction.save(slot_item);
    return new_quantity <= 0 ? new_quantity : 0;
  }

  const similiar_inventory_stack = inventorySlots.filter((i) => i.itemId === itemId);
  if (!similiar_inventory_stack.length) {
    return quantity;
  }
  let quantity_left_to_remove = Math.abs(quantity);
  for (let i = 0; i < similiar_inventory_stack.length; i++) {
    if (quantity_left_to_remove === 0) {
      break;
    }
    const stack = similiar_inventory_stack[i];
    if (stack.quantity > quantity_left_to_remove) {
      stack.quantity -= quantity_left_to_remove;
      quantity_left_to_remove = 0;
    } else if (stack.quantity <= quantity_left_to_remove) {
      quantity_left_to_remove -= stack.quantity;
      stack.quantity = 0;
      stack.item = null;
      stack.itemId = null;
    }
  }

  for (let i = 0; i < similiar_inventory_stack.length; i++) {
    await transaction.save(similiar_inventory_stack[i]);
  }

  if (quantity_left_to_remove > 0) {
    log(`Could not remove ${quantity_left_to_remove} of item ${itemId} from inventory. Potential quantity leak`, LogLevel.ERROR);
  }

  return -quantity_left_to_remove;
}

export const safelyMoveItemsBetweenInventories = async (options: {
  fromId: number;
  fromType: 'user' | 'building';
  toId: number;
  toType: 'user' | 'building';
  toSlot?: number;
  fromSlot?: number;
  itemId: number;
  quantity: number;
  log?: boolean;
  processingRequirements?: DBBuildingProcessingRequirement[];
  fuelRequirements?: DBBuildingFuelRequirement[];
}) => {
  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  const { fromId, fromType, toId, toType, toSlot, fromSlot, itemId, quantity, processingRequirements, fuelRequirements } = options;

  try {
    const from_quantity_left = await (fromType === 'user'
      ? UserInventoryItem.addToInventory(queryRunner.manager, fromId, itemId, -quantity, fromSlot)
      : WorldBuildingInventory.addToInventory(queryRunner.manager, fromId, itemId, -quantity, fromSlot));

    // When transferring to a building without a specific slot, use slot-aware function
    let to_quantity_left: number;
    if (toType === 'building' && toSlot === undefined && (processingRequirements !== undefined || fuelRequirements !== undefined)) {
      // Fetch building inventory slots with slotType
      const buildingInventorySlots = await queryRunner.manager.find(WorldBuildingInventory, {
        where: { world_building: { id: toId } },
        relations: ['item'],
        order: { slot: 'ASC' },
      });

      to_quantity_left = await addToBuildingInventory({
        transaction: queryRunner.manager,
        inventorySlots: buildingInventorySlots,
        itemId,
        quantity,
        operationType: InventoryOperationType.TRANSFER_TO_BUILDING,
        processingRequirements,
        fuelRequirements,
      });
    } else if (toType === 'user') {
      to_quantity_left = await UserInventoryItem.addToInventory(queryRunner.manager, toId, itemId, quantity, toSlot);
    } else {
      to_quantity_left = await WorldBuildingInventory.addToInventory(queryRunner.manager, toId, itemId, quantity, toSlot);
    }

    options.log &&
      log(
        `Moved ${quantity} of item ${itemId} from inventory ${fromId} to inventory ${toId}, from quantity left: ${from_quantity_left}, to quantity left: ${to_quantity_left}`,
        LogLevel.INFO,
      );
    if (from_quantity_left !== 0 || to_quantity_left !== 0) {
      // If from_quantity_left is lower than 0, that means that we moved more items than we had in the inventory.
      if (from_quantity_left < 0) {
        log(
          `Suspicous inventory transaction. From: ${fromId} To: ${toId} Item: ${itemId} Quantity: ${quantity}, From quantity left: ${from_quantity_left}, To quantity left: ${to_quantity_left}`,
          LogLevel.ERROR,
        );
        log(`Tried to move items from inventory ${fromId} that we did not have.`, LogLevel.ERROR);
        throw new Error('Tried to move items from inventory that we did not have');
      }
      if (to_quantity_left > 0) {
        const refundToInventory =
          fromType === 'user'
            ? UserInventoryItem.addToInventory(queryRunner.manager, fromId, itemId, to_quantity_left, fromSlot)
            : WorldBuildingInventory.addToInventory(queryRunner.manager, fromId, itemId, to_quantity_left, fromSlot);
        await refundToInventory;
      } else if (to_quantity_left < 0) throw new Error('Tried to move items to inventory that we did not have');
    }
    await queryRunner.commitTransaction();

    fromType === 'user' ? publishUserInventoryUpdate(fromId) : publishWorldBuildingUpdate(fromId);
    toType === 'user' ? publishUserInventoryUpdate(toId) : publishWorldBuildingUpdate(toId);

    options.log && log(`Moved ${quantity} of item ${itemId} from inventory ${fromId} to inventory ${toId}`, LogLevel.INFO);
  } catch (e) {
    log(`Error moving items between inventories: ${e}. Rolling back...`, LogLevel.ERROR);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
};
