import { ClientPacket, PacketType, SyncClientEntityPacket } from '@virtcon2/network-packet';
import { MainPlayer, Position, SerializationID, serializeConfig, Velocity } from '@virtcon2/network-world-entities';
import Game, { GameState } from '../scenes/Game';
import { Changed, defineQuery, defineSerializer, defineSystem, World } from '@virtcon2/bytenetc';
import { every } from '@shared';

const mainPlayerVelocityQuery = defineQuery(MainPlayer, Changed(Velocity), Position);
const mainPlayerQuery = defineQuery(MainPlayer, Position, Velocity);
const serializeMovement = defineSerializer(serializeConfig[SerializationID.PLAYER_MOVEMENT]);

export const createMainPlayerSyncSystem = (world: World) => {
  const shouldUpdatePosition = every(50);

  return defineSystem<GameState>((state) => {
    const mainPlayerWithChangedVelcoity = mainPlayerVelocityQuery(world);
    const mainPlayer = mainPlayerQuery(world);
    const isPlayerMoving = mainPlayer.some((eid) => Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0);

    const shouldUpdate = isPlayerMoving && shouldUpdatePosition();

    if (!mainPlayerWithChangedVelcoity.length && !shouldUpdate) return state;

    const mainPlayerEntity = mainPlayer[0];

    const sprite = state.spritesById[mainPlayerEntity];
    if (!sprite) throw new Error(`No sprite for main player entity ${mainPlayerEntity}`);

    Position.x[mainPlayerEntity] = sprite.x;
    Position.y[mainPlayerEntity] = sprite.y;

    const [packetData] = serializeMovement(world, [mainPlayerEntity]);
    if (!packetData) return state;

    const packet: ClientPacket<SyncClientEntityPacket> = {
      packet_type: PacketType.SYNC_CLIENT_ENTITY,
      data: {
        serializationId: SerializationID.PLAYER_MOVEMENT,
        data: packetData,
      },
    };
    Game.network.sendPacket(packet);

    return state;
  });
};
