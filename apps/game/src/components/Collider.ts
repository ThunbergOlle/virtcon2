import { Types, defineComponent } from "@virtcon2/virt-bit-ecs";

export const Collider = defineComponent({
  sizeWidth: Types.i32,
  sizeHeight: Types.i32,
  offsetX: Types.f32,
  offsetY: Types.f32,
  scale: Types.f32,
  static: Types.ui8, // 0 = false, 1 = true
  group: Types.ui8,
  interactable: Types.ui8 // 0 = false, 1 = true
});
