import { defineComponent, Types } from '@virtcon2/bytenetc';

export const Player = defineComponent('player', {
  userId: Types.ui32,
  facing: Types.ui16,
});
