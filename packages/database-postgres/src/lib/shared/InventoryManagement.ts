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
    slot_item.quantity = new_quantity;

    await slot_item.save();
    return quantity - new_quantity;
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
    const new_quantity = Math.min(  stack_with_space.quantity + quantity, stack_size);
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
  log(`New quantity of item ${itemId} in slot ${slot.slot} is ${slot.quantity}`, LogLevel.INFO);
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
    const new_quantity = Math.max(slot_item.quantity + quantity, 0);
    slot_item.quantity = new_quantity;

    if (new_quantity === 0) {
      slot_item.item = null;
    }

    await slot_item.save();
    return quantity - new_quantity;
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
    console.trace();
  }

  return -quantity_left_to_remove;
}
