import { defineComponent, Types } from '@virtcon2/bytenetc';

export const GhostBuilding = defineComponent('ghostBuilding', {
  placementIsValid: Types.ui8, // 0 = false, 1 = true
});
