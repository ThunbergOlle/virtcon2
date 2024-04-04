import { defineComponent, Types } from 'bitecs';
// import { createSerializer } from '../utils/serialize';

export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

// export const PositionSerializer = createSerializer<typeof Position>('position', Position);
