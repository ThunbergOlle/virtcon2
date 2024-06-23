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
      type: WindowType.VIEW_BUILDING,
      open: false,
    },
    {
      type: WindowType.VIEW_PLAYER_INVENTORY,
      open: false,
    },
    {
      type: WindowType.VIEW_MENU,
      open: false,
    },
    {
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
      const oldStackIndex = state.windows.findIndex((i) => i.type === action.payload);
      if (oldStackIndex === -1) return;
      const stack = state.windows;
      const item = stack[oldStackIndex];
      item.open = true;
      state.windows = [...stack.slice(0, oldStackIndex), ...stack.slice(oldStackIndex + 1), item];
    },
    close: (state, action: PayloadAction<WindowType>) => {
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
  const zIndex = state.window.windows.findIndex((i) => i.type === window);

  return `z${zIndex}`;
};

export const isWindowOpen = (state: RootState, window: WindowType) => {
  const item = state.window.windows.find((i) => i.type === window);
  if (item) {
    return item.open;
  }
  return false;
};

export default windowSlice.reducer;
