import { defineComponent, Types } from '@virtcon2/bytenetc';

export const ConveyorItem = defineComponent('conveyorItem', {
  onConveyorEntity: Types.ui32, // ECS entity ID of current conveyor (0 = none)
  reachedCheckpoint: Types.ui8, // 0 = moving to lane position, 1 = moving in conveyor direction
  lane: Types.i8, // -1 = left/upper lane, 1 = right/lower lane
});
