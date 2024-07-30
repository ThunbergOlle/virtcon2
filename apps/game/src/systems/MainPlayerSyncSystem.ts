import { ClientPacket, PacketType, SyncClientEntityPacket } from '@virtcon2/network-packet';
import { Buffer } from 'buffer';
import { MainPlayer, Position, SerializationID, serializeConfig, Velocity } from '@virtcon2/network-world-entities';
import Game, { GameState } from '../scenes/Game';
import { defineQuery, defineSerializer, defineSystem } from '@virtcon2/bytenetc';

const mainPlayerVelocityQuery = defineQuery(MainPlayer, Velocity, Position);
const serializeMovement = defineSerializer(serializeConfig[SerializationID.PLAYER_MOVEMENT]);

export const createMainPlayerSyncSystem = () => {
  return defineSystem<GameState>((state) => {
    const mainPlayerEntities = mainPlayerVelocityQuery();
    if (!mainPlayerEntities.length) return state;
    const mainPlayerEntity = mainPlayerEntities[0];

    console.log(`Main player entity: ${mainPlayerEntity}`);

    const sprite = state.spritesById[mainPlayerEntity];
    if (!sprite) throw new Error(`No sprite for main player entity ${mainPlayerEntity}`);

    Position.x[mainPlayerEntity] = sprite.x;
    Position.y[mainPlayerEntity] = sprite.y;

    const [packetData] = serializeMovement([mainPlayerEntity]);
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
