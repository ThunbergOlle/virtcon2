import { LogLevel, log } from '@shared';
import { publishUserInventoryUpdate, UserInventoryItem } from '../entity/user_inventory_item/UserInventoryItem';
import { publishWorldBuildingInventoryUpdate, WorldBuildingInventory } from '../entity/world_building_inventory/WorldBuildingInventory';
import { EntityManager } from 'typeorm';
import { AppDataSource } from '../data-source';
import { all_db_items } from '@virtcon2/static-game-data';

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
}) => {
  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  const { fromId, fromType, toId, toType, toSlot, fromSlot, itemId, quantity } = options;

  try {
    const from_quantity_left = await (fromType === 'user'
      ? UserInventoryItem.addToInventory(queryRunner.manager, fromId, itemId, -quantity, fromSlot)
      : WorldBuildingInventory.addToInventory(queryRunner.manager, fromId, itemId, -quantity, fromSlot));
    const to_quantity_left = await (toType === 'user'
      ? UserInventoryItem.addToInventory(queryRunner.manager, toId, itemId, quantity, toSlot)
      : WorldBuildingInventory.addToInventory(queryRunner.manager, toId, itemId, quantity, toSlot));

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

    fromType === 'user' ? publishUserInventoryUpdate(fromId) : publishWorldBuildingInventoryUpdate(fromId);
    toType === 'user' ? publishUserInventoryUpdate(toId) : publishWorldBuildingInventoryUpdate(toId);

    options.log && log(`Moved ${quantity} of item ${itemId} from inventory ${fromId} to inventory ${toId}`, LogLevel.INFO);
  } catch (e) {
    log(`Error moving items between inventories: ${e}. Rolling back...`, LogLevel.ERROR);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
};
