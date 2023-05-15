import { NetworkPacketData, PacketType, PlayerMovePacketData } from '@virtcon2/network-packet';
import { IWorld, defineQuery, defineSystem } from '@virtcon2/virt-bit-ecs';
import { MainPlayer } from '../components/MainPlayer';
import { Velocity } from '../components/Velocity';
import Game, { GameState } from '../scenes/Game';

const mainPlayerVelocityQuery = defineQuery([MainPlayer, Velocity]);
export const createPlayerSendNetworkSystem = () => {
  return defineSystem((world: IWorld, state: GameState, packets) => {
    const mainPlayerEntity = mainPlayerVelocityQuery(world)[0];
    if (!mainPlayerEntity) return { world, state };

    if (Velocity.x[mainPlayerEntity] !== 0 || Velocity.y[mainPlayerEntity] !== 0) {
      const sprite = state.spritesById[mainPlayerEntity];
      if (!sprite) return { world, state };
      const packet: NetworkPacketData<PlayerMovePacketData> = {
        data: {
          player_id: state.playerById[mainPlayerEntity],
          position: [sprite.body.position.x + 8, sprite.body.position.y + 8], /* Offset to make sure we render at the correct place */
        },
        packet_type: PacketType.PLAYER_SET_POSITION,
        world_id: state.world_id,
      };
      Game.network.sendPacket(packet);
    }
    return { world, state };
  });
};
