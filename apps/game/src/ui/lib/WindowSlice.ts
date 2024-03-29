import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';

export enum WindowType {
  VIEW_BUILDING = 'view_building',
  VIEW_PLAYER_INVENTORY = 'view_player_inventory',
  VIEW_MENU = 'view_menu',
  VIEW_CRAFTER = 'view_crafter',
}

interface WindowStack {
  stackIndex: number;
  type: WindowType;
  open: boolean;
}

// Define a type for the slice state
interface WindowState {
  windows: Array<WindowStack>;
}

// Define the initial state using that type
const initialState: WindowState = {
  windows: [
    {
      stackIndex: 0,
      type: WindowType.VIEW_BUILDING,
      open: false,
    },
    {
      stackIndex: 1,
      type: WindowType.VIEW_PLAYER_INVENTORY,
      open: false,
    },
    {
      stackIndex: 2,
      type: WindowType.VIEW_MENU,
      open: false,
    },
    {
      stackIndex: 3,
      type: WindowType.VIEW_CRAFTER,
      open: false,
    },
  ],
};

export const windowSlice = createSlice({
  name: 'window',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    select: (state, action: PayloadAction<WindowType>) => {
      let stack = state.windows;
      const selectedWindow = action.payload;
      // If the window is already the highest in the stack, do nothing.
      if (stack && stack[stack.length - 1]?.type === selectedWindow) state.windows[stack.length - 1].open = true;

      const oldStackIndex = stack.find((i) => i.type === selectedWindow)?.stackIndex; // Find the old index of the window we want to bring to the top.
      if (oldStackIndex === undefined) throw new Error('Window not found in stack');

      stack = stack.filter((i) => i.type !== selectedWindow); // Update the stack and remove the item we want to put on top of the stack.

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
        type: selectedWindow,
        open: true,
      });

      state.windows = stack;
    },
    close: (state, action: PayloadAction<WindowType>) => {
      console.log('close');
      const stack = state.windows;
      const selectedWindow = action.payload;
      const item = stack.find((i) => i.type === selectedWindow);
      if (item) {
        item.open = false;
      }
    },
    toggle: (state, action: PayloadAction<WindowType>) => {
      const stack = state.windows;
      const selectedWindow = action.payload;
      const item = stack.find((i) => i.type === selectedWindow);
      if (item) {
        item.open = !item.open;
      }
    },
  },
});

export const { select, close, toggle } = windowSlice.actions;

export const selectClass = (state: RootState, window: WindowType) => {
  const item = state.window.windows.find((i) => i.type === window)?.stackIndex; // The stackIndex represents the z-index of the window.
  return item ? 'z' + item : 'z0';
};

export const isWindowOpen = (state: RootState, window: WindowType) => {
  const item = state.window.windows.find((i) => i.type === window);
  if (item) {
    return item.open;
  }
  return false;
};

export default windowSlice.reducer;
