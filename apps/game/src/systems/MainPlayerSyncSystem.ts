import { ClientPacket, PacketType, SyncClientEntityPacket } from '@virtcon2/network-packet';
import { MainPlayer, Position, SerializationID, serializeConfig, Velocity } from '@virtcon2/network-world-entities';
import Game, { GameState } from '../scenes/Game';
import { Changed, defineQuery, defineSerializer, defineSystem, World } from '@virtcon2/bytenetc';

const mainPlayerVelocityQuery = defineQuery(MainPlayer, Changed(Velocity), Position);
const serializeMovement = defineSerializer(serializeConfig[SerializationID.PLAYER_MOVEMENT]);

export const createMainPlayerSyncSystem = (world: World) => {
  return defineSystem<GameState>((state) => {
    const mainPlayerEntities = mainPlayerVelocityQuery(world);
    if (!mainPlayerEntities.length) return state;
    const mainPlayerEntity = mainPlayerEntities[0];

    console.log(`Main player entity: ${mainPlayerEntity}`);

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
