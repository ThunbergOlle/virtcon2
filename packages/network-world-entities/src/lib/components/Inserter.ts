import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Inserter = defineComponent('inserter', {
  direction: Types.ui8, // 0=right, 1=down, 2=left, 3=up (front facing direction)
  heldItemId: Types.ui32, // Item ID being held (0 = empty)
  enabled: Types.ui8, // 1 = active, 0 = disabled (target full)
  progressTick: Types.ui16, // Ticks since pickup started (0 = idle)
});
