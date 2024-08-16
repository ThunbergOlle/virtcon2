import { defineComponent, Types } from '@virtcon2/bytenetc';

export enum MainPlayerAction {
  IDLE = 0,
  ATTACKING = 1,
}

export const MainPlayer = defineComponent('MainPlayer', {
  action: Types.ui8,
});
