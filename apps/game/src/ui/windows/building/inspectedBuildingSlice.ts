import Game from '../../../scenes/Game';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ClientPacket, InspectBuildingClientPacket, PacketType } from '@virtcon2/network-packet';

interface InspectedBuildingState {
  inspectedWorldBuildingId: number | null;
}

const initialState: InspectedBuildingState = {
  inspectedWorldBuildingId: null,
};

export const inspectedBuildingSlice = createSlice({
  name: 'inspectedBuilding',
  initialState,
  reducers: {
    inspectBuilding: (state, action: PayloadAction<number>) => {
      state.inspectedWorldBuildingId = action.payload;
    },
    doneInspectingBuilding: (state) => {
      state.inspectedWorldBuildingId = null;
    },
  },
});

export const { inspectBuilding, doneInspectingBuilding } = inspectedBuildingSlice.actions;

export default inspectedBuildingSlice.reducer;
