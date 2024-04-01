import { Types, defineComponent } from 'bitecs';

export const Resource = defineComponent({
  health: Types.i32,
  itemId: Types.ui16,
  id: Types.ui16,
});
