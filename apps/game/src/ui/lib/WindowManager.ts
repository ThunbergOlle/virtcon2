import { Dispatch } from 'react';
import { windowStackReducer } from '../context/window/WindowContext';

export enum WindowType {
  VIEW_BUILDING = 'view_building',
  VIEW_PLAYER_INVENTORY = 'view_player_inventory',
  VIEW_MENU = 'view_menu',
  VIEW_CRAFTER = 'view_crafter',
}

export interface WindowStack {
  stackIndex: number;
  type: WindowType;
  open: boolean;
}

export interface WindowManager {
  setWindowStack: Dispatch<{ type: 'open' | 'close' | 'select' | 'register' | 'toggle'; windowType: WindowType }>;
  windowStack: WindowStack[];
}

export interface WindowManagerFunctions {
  selectWindow: (window: WindowType, stack: WindowStack[]) => WindowStack[];
  getClass: (window: WindowType, stack: WindowStack[]) => string;
  closeWindow: (window: WindowType, stack: WindowStack[]) => WindowStack[];
  registerWindow: (window: WindowType, stack: WindowStack[]) => WindowStack[];
  isOpen: (window: WindowType, stack: WindowStack[]) => boolean;
  isFocused: (window: WindowType, stack: WindowStack[]) => boolean;
}

const selectWindow = (window: WindowType, stack: WindowStack[]): WindowStack[] => {
  // If the window is already the highest in the stack, do nothing.
  if (stack && stack[stack.length - 1]?.type === window) {
    stack[stack.length - 1].open = true;
    return stack;
  }
  const oldStackIndex = stack.find((i) => i.type === window)?.stackIndex; // Find the old index of the window we want to bring to the top.
  if (oldStackIndex === undefined) throw new Error('Window not found in stack');

  stack = stack.filter((i) => i.type !== window); // Update the stack and remove the item we want to put on top of the stack.

  let biggestVal = 0;
  for (let i = 0; i < stack.length; i++) {
    // Loop throgh the stack and find the index and value of the item highest on the stack.
    if (stack[i].stackIndex > biggestVal) {
      biggestVal = stack[i].stackIndex;
    }
  }

  const lesserStack = stack.filter((i) => i.stackIndex < oldStackIndex);

  const higherStack = stack.filter((i) => i.stackIndex > oldStackIndex);

  // Move all of the items in the stack that has a higher stack value to a lower stack value (-1). The goal is to not have any "gaps" in the stack values
  higherStack.forEach((i) => {
    i.stackIndex = i.stackIndex - 1;
  });

  stack = [...lesserStack, ...higherStack]; // Update the stack with the new values.

  // Add the window to the top of the stack.
  stack.push({
    stackIndex: biggestVal,
    type: window,
    open: true,
  });
  return stack;
};
// Method for getting the class value of a window. This is later used in the CSS-part of windows.
const getClass = (window: WindowType, stack: WindowStack[]) => {
  const item = stack.find((i) => i.type === window)?.stackIndex; // The stackIndex represents the z-index of the window.
  return item ? 'z' + item : 'z0';
};

const closeWindow = (window: WindowType, stack: WindowStack[]): WindowStack[] => {
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
const registerWindow = (window: WindowType, stack: WindowStack[]): WindowStack[] => {
  const item = stack.find((i) => i.type === window);
  if (!item) {
    stack.push({ stackIndex: stack.length, type: window, open: false });
  }
  return stack;
};

const isFocused = (window: WindowType, stack: WindowStack[]) => {
  const item = stack[stack.length - 1];
  if (item) {
    return item.type === window;
  }
  return false;
};

export const windowManager: WindowManagerFunctions = {
  selectWindow,
  getClass,
  closeWindow,
  registerWindow,
  isOpen,
  isFocused,
};
