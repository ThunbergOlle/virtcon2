import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Collider = defineComponent('collider', {
  sizeWidth: Types.ui32,
  sizeHeight: Types.ui32,
  offsetX: Types.f32,
  offsetY: Types.f32,
  scale: Types.f32,
  static: Types.ui8, // 0 = false, 1 = true
  group: Types.ui8,
  interactable: Types.ui8, // 0 = false, 1 = true
});
