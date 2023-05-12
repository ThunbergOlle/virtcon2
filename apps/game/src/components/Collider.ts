import { Types, defineComponent } from "@virtcon2/virt-bit-ecs";

export const Collider = defineComponent({
  sizeWidth: Types.i32,
  sizeHeight: Types.i32,
  offsetX: Types.i32,
  offsetY: Types.i32,
  scale: Types.f32,
});
