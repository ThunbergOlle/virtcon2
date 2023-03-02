export enum WindowType {
  VIEW_BUILDING = "view_building",
}
  

export class WindowStack {
  // Class for the window stack
  stack: { stackIndex: number; type: WindowType }[]; // A stack contains an array of windows with an index.
  constructor() {
    this.stack = [];
  }
  selectWindow(window: WindowType) {
    // If the window is already the highest in the stack, do nothing.
    if (this.stack && this.stack[this.stack.length - 1]?.type === window)
      return;
    const oldVal = this.stack.find((i) => i.type === window)?.stackIndex; // Find the old index of the window we want to bring to the top.
    // Först så kolla vilken som har den största zIndex.

    this.stack = this.stack.filter((i) => i.type !== window); // Update the stack and remove the item we want to put on top of the stack.

    let biggestIndex = -1;
    let biggestVal = 0;
    for (let i = 0; i < this.stack.length; i++) {
      // Loop throgh the stack and find the index and value of the item highest on the stack.
      if (this.stack[i].stackIndex >= biggestVal) {
        biggestIndex = i;
        biggestVal = this.stack[i].stackIndex;
      }
    }
    if (oldVal !== undefined) {
      // If we have the old value of the window, we need to update the stack.
      this.stack = this.stack.map((i) =>
        i.stackIndex >= oldVal
          ? { type: i.type, stackIndex: i.stackIndex - 1 } // Move all of the items in the stack that has a higher stack value to a lower stack value (-1). The goal is to not have any "gaps" in the stack values
          : i
      );
    }
    // Add the window to the top of the stack.
    this.stack.push({
      stackIndex: oldVal === undefined ? biggestVal + 1 : biggestVal,
      type: window,
    });
  }
  // Method for getting the class value of a window. This is later used in the CSS-part of windows.
  getClass(window: WindowType) {
    const item = this.stack.find((i) => i.type === window)?.stackIndex; // The stackIndex represents the z-index of the window.
    return item ? "z" + item : "z1";
  }
}
