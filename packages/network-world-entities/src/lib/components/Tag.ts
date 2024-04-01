import { Types, defineComponent } from 'bitecs';

export const MAX_TAG_LENGTH = 32;
export const Tag = defineComponent({
  value: [Types.ui8, MAX_TAG_LENGTH],
});
