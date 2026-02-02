import { defineComponent, Types } from '@virtcon2/bytenetc';

export const ConveyorItem = defineComponent('conveyorItem', {
  onConveyorEntity: Types.ui32, // ECS entity ID of current conveyor (0 = none)
});
