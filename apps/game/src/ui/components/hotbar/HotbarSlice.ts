import { gql } from '@apollo/client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DBUserInventoryItem, get_tool_by_item_name } from '@virtcon2/static-game-data';
import {
  cancelPlaceBuildingIntent,
  isTryingToPlaceBuilding,
  startPlaceBuildingIntent,
  START_PLACE_BUILDING_INTENT_FRAGMENT,
} from '../../lib/buildingPlacement';

type HotbarState = {
  items: Array<DBUserInventoryItem | null>;
  selectedSlot: number;
};

const initialState: HotbarState = {
  selectedSlot: 0,
  items: new Array(9).fill(null),
};

export const HOTBAR_SELECT_FRAGMENT = gql`
  ${START_PLACE_BUILDING_INTENT_FRAGMENT}
  fragment HotbarSelectFragment on UserInventoryItem {
    id
    item {
      id
      is_building
    }
    ...StartPlaceBuildingIntentFragment
  }
`;

export const hotbarSlice = createSlice({
  name: 'hotbar',
  initialState,
  reducers: {
    select: (state, action: PayloadAction<{ slot: number }>) => {
      state.selectedSlot = action.payload.slot;

      if (isTryingToPlaceBuilding()) cancelPlaceBuildingIntent();

      const inventoryItem = state.items[action.payload.slot];
      if (!inventoryItem) return;

      if (inventoryItem?.item?.is_building) startPlaceBuildingIntent(inventoryItem);
    },
    set: (state, action: PayloadAction<{ item: DBUserInventoryItem; slot: number }>) => {
      state.items[action.payload.slot] = action.payload.item;
    },
  },
});

export const currentItem = (state: { hotbar: HotbarState }) => state.hotbar.items[state.hotbar.selectedSlot];
export const currentSlot = (state: { hotbar: HotbarState }) => state.hotbar.selectedSlot;
export const currentTool = (state: { hotbar: HotbarState }) =>
  state.hotbar.items[state.hotbar.selectedSlot] && get_tool_by_item_name(state.hotbar.items[state.hotbar.selectedSlot]!.item!.name);
export const hotbarItems = (state: { hotbar: HotbarState }) => state.hotbar.items;

export const { select } = hotbarSlice.actions;
export default hotbarSlice.reducer;
