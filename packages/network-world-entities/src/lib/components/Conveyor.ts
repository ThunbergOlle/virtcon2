import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Conveyor = defineComponent('conveyor', {
  direction: Types.ui8, // 0=right, 1=down, 2=left, 3=up (rotation / 90)
  speed: Types.f32, // pixels per tick (default ~1.5)
});
