import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DBItem, get_tool_by_item_name } from '@virtcon2/static-game-data';

type HotbarState = {
  items: Array<DBItem | null>;
  selectedSlot: number;
};

const initialState: HotbarState = {
  selectedSlot: 0,
  items: new Array(9).fill(null),
};

export const hotbarSlice = createSlice({
  name: 'hotbar',
  initialState,
  reducers: {
    select: (state, action: PayloadAction<{ slot: number }>) => {
      state.selectedSlot = action.payload.slot;
    },
    add: (state, action: PayloadAction<{ item: DBItem; slot: number }>) => {
      state.items[action.payload.slot] = action.payload.item;
    },
  },
});

export const currentItem = (state: { hotbar: HotbarState }) => state.hotbar.items[state.hotbar.selectedSlot];
export const currentTool = (state: { hotbar: HotbarState }) =>
  state.hotbar.items[state.hotbar.selectedSlot] && get_tool_by_item_name(state.hotbar.items[state.hotbar.selectedSlot]!.name);
export const hotbarItems = (state: { hotbar: HotbarState }) => state.hotbar.items;

export const { select } = hotbarSlice.actions;
export default hotbarSlice.reducer;
