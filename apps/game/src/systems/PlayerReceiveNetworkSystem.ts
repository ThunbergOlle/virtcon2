import { IWorld, removeEntity } from 'bitecs';
import { GameState } from '../scenes/Game';

import { DisconnectPacketData, PacketType, ServerPacket } from '@virtcon2/network-packet';
import { filterPacket } from '../networking/Filters';

export const handleDisconnectPackets = (world: IWorld, state: GameState, packets: ServerPacket<unknown>[], entities: number[]) => {
  const disconnectPackets = filterPacket<DisconnectPacketData>(packets, PacketType.DISCONNECT);
  /* Handle disconnect packets. */
  for (let i = 0; i < disconnectPackets.length; i++) {
    const entity = entities.filter((entity) => state.playerById[entity] === disconnectPackets[i].data.id)[0];
    if (entity) {
      console.log(`Player ${disconnectPackets[i].data.id} disconnected. Entity: ${entity}`);
      delete state.playerById[entity];
      removeEntity(world, entity);
    }
  }
};
