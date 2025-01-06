import { defineComponent, Types } from '@virtcon2/bytenetc';

export const ConnectionPoint = defineComponent('connectionPoint', {
  startX: Types.i32,
  startY: Types.i32,
  endX: Types.i32,
  endY: Types.i32,
});
