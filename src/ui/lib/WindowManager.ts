import { useState } from "react";

export enum WindowType {
  VIEW_BUILDING = "view_building",
  VIEW_PLAYER_INVENTORY = "view_player_inventory",
}

export interface WindowStack {
  stackIndex: number;
  type: WindowType;
  open: boolean;
}

export interface WindowManager {
  selectWindow: (window: WindowType) => void;
  getClass: (window: WindowType) => string;
  closeWindow: (window: WindowType) => void;
  openWindow: (window: WindowType) => void;
  registerWindow: (window: WindowType) => void;
  isOpen: (window: WindowType) => boolean;
  stack: WindowStack[];
}

export interface WindowManagerFunctions {
  selectWindow: (window: WindowType, stack: WindowStack[]) => WindowStack[];
  getClass: (window: WindowType, stack: WindowStack[]) => string;
  closeWindow: (window: WindowType, stack: WindowStack[]) => WindowStack[];
  openWindow: (window: WindowType, stack: WindowStack[]) => WindowStack[];
  registerWindow: (window: WindowType, stack: WindowStack[]) => WindowStack[];
  isOpen: (window: WindowType, stack: WindowStack[]) => boolean;
}

const selectWindow = (
  window: WindowType,
  stack: WindowStack[]
): WindowStack[] => {
  
  // If the window is already the highest in the stack, do nothing.
  if (stack && stack[stack.length - 1]?.type === window) return stack;
  const oldVal = stack.find((i) => i.type === window)?.stackIndex; // Find the old index of the window we want to bring to the top.
  // Först så kolla vilken som har den största zIndex.

  stack = stack.filter((i) => i.type !== window); // Update the stack and remove the item we want to put on top of the stack.

  let biggestVal = 0;
  for (let i = 0; i < stack.length; i++) {
    // Loop throgh the stack and find the index and value of the item highest on the stack.
    if (stack[i].stackIndex >= biggestVal) {
      biggestVal = stack[i].stackIndex;
    }
  }
  if (oldVal !== undefined) {
    // If we have the old value of the window, we need to update the stack.
    stack = stack.map((i) =>
      i.stackIndex >= oldVal
        ? { type: i.type, stackIndex: i.stackIndex - 1, open: i.open } // Move all of the items in the stack that has a higher stack value to a lower stack value (-1). The goal is to not have any "gaps" in the stack values
        : i
    );
  }
  // Add the window to the top of the stack.
  stack.push({
    stackIndex: oldVal === undefined ? biggestVal + 1 : biggestVal,
    type: window,
    open: true,
  });
  return stack;
};
// Method for getting the class value of a window. This is later used in the CSS-part of windows.
const getClass = (window: WindowType, stack: WindowStack[]) => {
  const item = stack.find((i) => i.type === window)?.stackIndex; // The stackIndex represents the z-index of the window.
  return item ? "z" + item : "z0";
};

const openWindow = (
  window: WindowType,
  stack: WindowStack[]
): WindowStack[] => {
  console.log("Opening window: " + window + " in WindowManager.ts");
  const item = stack.find((i) => i.type === window);
  if (item) {
    item.open = true;
  }
  return stack;
};
const closeWindow = (
  window: WindowType,
  stack: WindowStack[]
): WindowStack[] => {
  const item = stack.find((i) => i.type === window);
  if (item) {
    item.open = false;
  }
  return stack;
};
const isOpen = (window: WindowType, stack: WindowStack[]) => {
  const item = stack.find((i) => i.type === window);
  if (item) {
    return item.open;
  }
  return false;
};
const registerWindow = (
  window: WindowType,
  stack: WindowStack[]
): WindowStack[] => {
  console.log("Registering window: " + window + " in WindowManager.ts")
  const item = stack.find((i) => i.type === window);
  if (!item) {
    stack.push({ stackIndex: stack.length, type: window, open: false });
  }
  return stack;
};

export const windowManager: WindowManagerFunctions = {
  selectWindow,
  getClass,
  openWindow,
  closeWindow,
  registerWindow,
  isOpen,
};
