import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Resource = defineComponent('resource', {
  health: Types.i32,
  itemId: Types.ui16,
  id: Types.ui16,
  worldBuildingId: Types.ui16,
});
