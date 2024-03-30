import { LogLevel, log } from '@shared';
import { Item } from '../entity/item/Item';
import { UserInventoryItem } from '../entity/user_inventory_item/UserInventoryItem';
import { WorldBuildingInventory } from '../entity/world_building_inventory/WorldBuildingInventory';

export async function addToInventory(
  inventorySlots: (WorldBuildingInventory | UserInventoryItem)[],
  itemId: number,
  quantity: number,
  slot: number,
): Promise<number> {
  const { stack_size } = await Item.findOne({ where: { id: itemId } });
  if (quantity < 0) {
    return handleNegativeQuantities(inventorySlots, itemId, quantity, slot);
  }

  if (slot) {
    log(`Adding ${quantity} of item ${itemId} to slot ${slot}`, LogLevel.INFO);
    // check if slot is occupied
    const slot_item = inventorySlots.find((i) => i.slot === slot);
    if (!slot_item) {
      log(`Slot ${slot} cannot be found in inventory`, LogLevel.ERROR);
      return quantity;
    }
    if (slot_item && !slot_item.item) {
      return createNewStack(inventorySlots, itemId, quantity, slot);
    }
    // check if item is the same
    if (slot_item.item?.id !== itemId) {
      return quantity;
    }
    // add the item to the slot
    const new_quantity = Math.min(slot_item.quantity + quantity, stack_size);
    const remainder = Math.max(quantity - (stack_size - slot_item.quantity), 0);
    slot_item.quantity = new_quantity;

    await slot_item.save();
    return remainder;
  }

  const similiar_inventory_stack = inventorySlots.filter((i) => i.item && i.item.id === itemId);
  const empty_inventory_slots = inventorySlots.filter((i) => i.item === null);
  const stack_with_space = similiar_inventory_stack.find((i) => i.quantity < stack_size);

  // create a new stack if we have space and if we need to.
  if (!stack_with_space && empty_inventory_slots.length) {
    return await createNewStack(empty_inventory_slots, itemId, quantity, slot);
  }
  // if there is a stack with space, add to it
  if (stack_with_space) {
    const new_quantity = Math.min(stack_with_space.quantity + quantity, stack_size);
    const remainder = Math.max(quantity - (stack_size - stack_with_space.quantity), 0);
    stack_with_space.quantity = new_quantity;
    await stack_with_space.save();
    return remainder;
  }

  return quantity;
}
async function createNewStack(
  empty_inventory_slots: (WorldBuildingInventory | UserInventoryItem)[],
  itemId: number,
  quantity: number,
  preferred_slot?: number,
): Promise<number> {
  const slot = preferred_slot !== undefined ? empty_inventory_slots.find((s) => s.slot === preferred_slot) : empty_inventory_slots[0];
  slot.item = { id: itemId } as Item;
  slot.quantity = quantity;
  await slot.save();
  return quantity - slot.quantity;
}

async function handleNegativeQuantities(
  inventorySlots: (WorldBuildingInventory | UserInventoryItem)[],
  itemId: number,
  quantity: number,
  slot?: number,
): Promise<number> {
  if (slot) {
    log(`Removing ${quantity} of item ${itemId} from slot ${slot}`, LogLevel.INFO);
    // check if slot is occupied
    const slot_item = inventorySlots.find((i) => i.slot === slot && i.item?.id === itemId);
    if (!slot_item) {
      log(`Slot ${slot} cannot be found in inventory`, LogLevel.ERROR);
      return quantity;
    }

    // remove the item from the slot
    const new_quantity = slot_item.quantity + quantity;

    slot_item.quantity = new_quantity < 0 ? 0 : new_quantity;

    if (slot_item.quantity === 0) {
      slot_item.item = null;
    }

    await slot_item.save();
    return new_quantity < 0 ? new_quantity : 0;
  }

  const similiar_inventory_stack = inventorySlots.filter((i) => i.item && i.item.id === itemId);
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
    }
  }

  await Promise.all(similiar_inventory_stack.map((i) => i.save()));
  if (quantity_left_to_remove > 0) {
    log(`Could not remove ${quantity_left_to_remove} of item ${itemId} from inventory. Potential quantity leak`, LogLevel.ERROR);
  }

  return -quantity_left_to_remove;
}

export async function safelyMoveItemsBetweenInventories(transaction: {
  fromId: number | string;
  fromType: 'user' | 'building';
  toId: number | string;
  toType: 'user' | 'building';
  toSlot?: number;
  fromSlot?: number;
  itemId: number;
  quantity: number;
}) {
  const { fromId, fromType, toId, toType, toSlot, fromSlot, itemId, quantity } = transaction;

  const fromInventory =
    fromType === 'user'
      ? UserInventoryItem.addToInventory(fromId as string, itemId, -quantity, fromSlot)
      : WorldBuildingInventory.addToInventory(fromId as number, itemId, -quantity, fromSlot);
  const toInventory =
    toType === 'user'
      ? UserInventoryItem.addToInventory(toId as string, itemId, quantity, toSlot)
      : WorldBuildingInventory.addToInventory(toId as number, itemId, quantity, toSlot);

  const [from_quantity_left, to_quantity_left] = await Promise.all([fromInventory, toInventory]);

  if (from_quantity_left !== 0 || to_quantity_left !== 0) {
    // If from_quantity_left is lower than 0, that means that we moved more items than we had in the inventory.
    if (from_quantity_left < 0) {
      log(
        `Suspicous inventory transaction. From: ${fromId} To: ${toId} Item: ${itemId} Quantity: ${quantity}, From quantity left: ${from_quantity_left}, To quantity left: ${to_quantity_left}`,
        LogLevel.ERROR,
      );
      log(`Tried to move items from inventory ${fromId} that we did not have.`, LogLevel.ERROR);
      // we need to remove the items from the toInventory
      const refundFromInventory =
        toType === 'user'
          ? UserInventoryItem.addToInventory(toId as string, itemId, from_quantity_left, toSlot)
          : WorldBuildingInventory.addToInventory(toId as number, itemId, from_quantity_left, toSlot);
      log(`Refunding ${from_quantity_left} of item ${itemId} from inventory ${toId} to inventory ${fromId}`, LogLevel.INFO);
      await refundFromInventory;
    }
    if (to_quantity_left > 0) {
      // this means that we moved more items than we had space for
      // we need to remove the items from the fromInventory
      const refundToInventory =
        fromType === 'user'
          ? UserInventoryItem.addToInventory(fromId as string, itemId, to_quantity_left, fromSlot)
          : WorldBuildingInventory.addToInventory(fromId as number, itemId, to_quantity_left, fromSlot);
      await refundToInventory;
    } else if (to_quantity_left < 0) {
      log(`Tried to move items to inventory ${toId} that we did not have.`, LogLevel.ERROR);
    }
  } else log(`Moved ${quantity} of item ${itemId} from inventory ${fromId} to inventory ${toId}`, LogLevel.INFO);
}
