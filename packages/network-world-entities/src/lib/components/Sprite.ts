import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Sprite = defineComponent('sprite', {
  texture: Types.ui16,
  variant: Types.ui8,
  opacity: Types.f32, // float between 0 and 1
  width: Types.ui8,
  height: Types.ui8,
  rotation: Types.ui16,
  dynamicBody: Types.ui8, // boolean
});
