import { defineComponent, Types } from '@virtcon2/bytenetc';

export const WorldBorder = defineComponent('worldBorder', {
  side: Types.i8, // 0 = left, 1 = right, 2 = top, 3 = bottom
});
