import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Assembler = defineComponent('assembler', {
  outputItemId: Types.ui32, // 0 = not configured
  progressTicks: Types.ui32, // accumulated ticks toward crafting
  requiredTicks: Types.ui32, // = ceil(craftingTime / 50), computed on load/change
});
