import { defineComponent, Types } from "@virtcon2/bytenetc";

export const Tile = defineComponent('tile', {
  height: Types.i8,
  type: [Types.ui8, 10]
});
