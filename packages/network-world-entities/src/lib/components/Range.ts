import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Range = defineComponent('range', {
  radius: Types.f32,
  minX: Types.f32,
  minY: Types.f32,
  maxX: Types.f32,
  maxY: Types.f32,
});
