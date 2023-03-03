import { useState } from "react";

export enum WindowType {
  VIEW_BUILDING = "view_building",
}

export interface WindowStack {
  stackIndex: number;
  type: WindowType;
  open: boolean;
}
export interface WindowManagerFunctions {
  selectWindow: (window: WindowType) => void;
  getClass: (window: WindowType) => string;
  closeWindow: (window: WindowType) => void;
  openWindow: (window: WindowType) => void;
  registerWindow: (window: WindowType) => void;
  isOpen: (window: WindowType) => boolean;
  stack: WindowStack[];
}
export function useWindowManager():WindowManagerFunctions {
  // Class for the window stack
  const [stack, setStack] = useState<WindowStack[]>([]); // A stack contains an array of windows with an index.

  const selectWindow = (window: WindowType) => {
    let localStack = [...stack];
    // If the window is already the highest in the stack, do nothing.
    if (localStack && localStack[stack.length - 1]?.type === window) return;
    const oldVal = stack.find((i) => i.type === window)?.stackIndex; // Find the old index of the window we want to bring to the top.
    // Först så kolla vilken som har den största zIndex.

    localStack = localStack.filter((i) => i.type !== window); // Update the stack and remove the item we want to put on top of the stack.

    let biggestVal = 0;
    for (let i = 0; i < localStack.length; i++) {
      // Loop throgh the stack and find the index and value of the item highest on the stack.
      if (localStack[i].stackIndex >= biggestVal) {
        biggestVal = localStack[i].stackIndex;
      }
    }
    if (oldVal !== undefined) {
      // If we have the old value of the window, we need to update the stack.
      localStack = stack.map((i) =>
        i.stackIndex >= oldVal
          ? { type: i.type, stackIndex: i.stackIndex - 1, open: i.open } // Move all of the items in the stack that has a higher stack value to a lower stack value (-1). The goal is to not have any "gaps" in the stack values
          : i
      );
    }
    // Add the window to the top of the stack.
    localStack.push({
      stackIndex: oldVal === undefined ? biggestVal + 1 : biggestVal,
      type: window,
      open: true,
    });
  };
  // Method for getting the class value of a window. This is later used in the CSS-part of windows.
  const getClass = (window: WindowType) => {
    const item = stack.find((i) => i.type === window)?.stackIndex; // The stackIndex represents the z-index of the window.
    return item ? "z" + item : "z1";
  };

  const openWindow = (window: WindowType) => {
    console.log("Opening window: " + window + " in WindowManager.ts");
    const item = stack.find((i) => i.type === window);
    if (item) {
      item.open = true;
    }
    setStack([...stack]);
  };
  const closeWindow = (window: WindowType) => {
    const item = stack.find((i) => i.type === window);
    if (item) {
      item.open = false;
    }
    setStack([...stack]);
  };
  const isOpen = (window: WindowType) => {
    const item = stack.find((i) => i.type === window);
    if (item) {
      return item.open;
    }
    return false;
  };
  const registerWindow = (window: WindowType) => {
    const item = stack.find((i) => i.type === window);
    if (!item) {
      stack.push({ stackIndex: stack.length, type: window, open: false });
    }
  };

  return {
    selectWindow,
    getClass,
    openWindow,
    closeWindow,
    registerWindow,
    isOpen,
    stack,
  };
}
