import { ClientPacket, PacketType, SyncClientEntityPacket } from '@virtcon2/network-packet';

import { MainPlayer, Position, Velocity } from '@virtcon2/network-world-entities';
import { Changed, defineQuery, defineSerializer, defineSystem, IWorld, pipe } from 'bitecs';
import Game, { GameState } from '../scenes/Game';

const mainPlayerVelocityQuery = defineQuery([MainPlayer, Velocity, Position]);
const config = [Position, Changed(Velocity)];
const serializeMovement = defineSerializer(config);

const serializeMovementQueryPositions = pipe(mainPlayerVelocityQuery, serializeMovement);
// const deserializeMovement = defineDeserializer(config)

export const createPlayerSendNetworkSystem = () => {
  return defineSystem<[], [IWorld, GameState]>(([world, state]) => {
    const mainPlayerEntity = mainPlayerVelocityQuery(world)[0];
    if (!mainPlayerEntity) return [world, state];

    if (Velocity.x[mainPlayerEntity] !== 0 || Velocity.y[mainPlayerEntity] !== 0) {
      const packetData = serializeMovementQueryPositions(mainPlayerEntity);
      const packet: ClientPacket<SyncClientEntityPacket> = {
        packet_type: PacketType.SYNC_CLIENT_ENTITY,
        data: packetData,
      };
      Game.network.sendPacket(packet);
    }
    return [world, state];
  });
};
