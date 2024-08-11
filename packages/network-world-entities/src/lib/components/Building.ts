import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Building = defineComponent('building', {
  worldBuildingId: Types.ui32,
  outputX: Types.ui32,
  outputY: Types.ui32,
});
