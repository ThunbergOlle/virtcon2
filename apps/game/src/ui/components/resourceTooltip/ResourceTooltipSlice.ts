import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type HoveredResource = {
  itemId: number;
  quantity: number;
  health: number;
} | null;

type ResourceTooltipState = {
  hoveredResource: HoveredResource;
};

const initialState: ResourceTooltipState = {
  hoveredResource: null,
};

export const resourceTooltipSlice = createSlice({
  name: 'resourceTooltip',
  initialState,
  reducers: {
    setHoveredResource: (state, action: PayloadAction<HoveredResource>) => {
      state.hoveredResource = action.payload;
    },
  },
});

export const hoveredResource = (state: { resourceTooltip: ResourceTooltipState }) => state.resourceTooltip.hoveredResource;

export const { setHoveredResource } = resourceTooltipSlice.actions;
export default resourceTooltipSlice.reducer;
