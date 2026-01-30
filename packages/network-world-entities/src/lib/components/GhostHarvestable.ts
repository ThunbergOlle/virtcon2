import { defineComponent, Types } from '@virtcon2/bytenetc';

export const GhostHarvestable = defineComponent('ghostHarvestable', {
  placementIsValid: Types.ui8, // 0 = false, 1 = true
  itemId: Types.ui16,
});
