import { defineComponent, Types } from '@virtcon2/bytenetc';

export const MAX_TAG_LENGTH = 32;
export const Tag = defineComponent('tag', {
  value: [Types.ui8, MAX_TAG_LENGTH],
});
