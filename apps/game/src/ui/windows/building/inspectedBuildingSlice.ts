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
      if (state.inspectedWorldBuildingId !== null) {
        Game.network.sendPacket({
          data: state.inspectedWorldBuildingId,
          packet_type: PacketType.DONE_INSPECTING_WORLD_BUILDING,
        });
      }
      const packet: ClientPacket<InspectBuildingClientPacket> = {
        data: {
          worldBuildingId: action.payload,
        },
        packet_type: PacketType.INSPECT_WORLD_BUILDING,
      };
      Game.network.sendPacket(packet);

      state.inspectedWorldBuildingId = action.payload;
    },
    doneInspectingBuilding: (state) => {
      state.inspectedWorldBuildingId = null;

      const packet: ClientPacket<null> = {
        data: null,
        packet_type: PacketType.INSPECT_WORLD_BUILDING,
      };
      Game.network.sendPacket(packet);
    },
  },
});

export const { inspectBuilding, doneInspectingBuilding } = inspectedBuildingSlice.actions;

export default inspectedBuildingSlice.reducer;
