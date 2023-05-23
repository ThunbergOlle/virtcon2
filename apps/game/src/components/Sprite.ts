import { Types, defineComponent } from '@virtcon2/virt-bit-ecs';


export const Sprite = defineComponent({
  texture: Types.ui16,
  width: Types.ui8,
  height: Types.ui8,
});
