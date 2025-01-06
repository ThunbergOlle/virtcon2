import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ToolTypes = 'none' | 'axe' | 'pickaxe' | 'electric_wrench';
const initialState: { tool: ToolTypes } = {
  tool: 'none',
};
export const hotbarSlice = createSlice({
  name: 'hotbar',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    select: (state, action: PayloadAction<ToolTypes>) => {
      state.tool = action.payload;
    },
  },
});

export const currentTool = (state: { hotbar: { tool: ToolTypes } }) => state.hotbar.tool;

export const { select } = hotbarSlice.actions;
export default hotbarSlice.reducer;
