import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Harvestable = defineComponent('harvestable', {
  id: Types.ui32,
  health: Types.i32,
  itemId: Types.ui16,
  dropCount: Types.ui8,
  age: Types.i32,
});
