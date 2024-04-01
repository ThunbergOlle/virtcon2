import { Types, defineComponent } from 'bitecs';

export const Sprite = defineComponent({
  texture: Types.ui16,
  opacity: Types.f32, // float between 0 and 1
  width: Types.ui8,
  height: Types.ui8,
  rotation: Types.f32, // radians
});
