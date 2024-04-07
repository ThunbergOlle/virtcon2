import { ClientPacket, PacketType, SyncClientEntityPacket } from '@virtcon2/network-packet';
import { Buffer } from 'buffer';
import { MainPlayer, Position, SerializationID, serializeConfig, Velocity } from '@virtcon2/network-world-entities';
import { Changed, defineQuery, defineSerializer, defineSystem, IWorld } from 'bitecs';
import Game, { GameState } from '../scenes/Game';

const mainPlayerVelocityQuery = defineQuery([MainPlayer, Changed(Velocity), Position]);
const serializeMovement = defineSerializer(serializeConfig[SerializationID.PLAYER_MOVEMENT]);

export const createMainPlayerSyncSystem = () => {
  const game = Game.getInstance();
  return defineSystem<[], [IWorld, GameState]>(([world, state]) => {
    const mainPlayerEntity = mainPlayerVelocityQuery(world)[0];
    if (!mainPlayerEntity) return [world, state];

    const sprite = state.spritesById[mainPlayerEntity];
    if (!sprite) throw new Error(`No sprite for main player entity ${mainPlayerEntity}`);

    Position.x[mainPlayerEntity] = sprite.x;
    Position.y[mainPlayerEntity] = sprite.y;

    const packetData = serializeMovement(world, mainPlayerEntity);
    if (!packetData) return [world, state];

    const dataView = new DataView(packetData);
    const buffer = Buffer.from(dataView.buffer, dataView.byteOffset, dataView.byteLength);

    const packet: ClientPacket<SyncClientEntityPacket> = {
      packet_type: PacketType.SYNC_CLIENT_ENTITY,
      data: {
        serializationId: SerializationID.PLAYER_MOVEMENT,
        buffer: buffer,
      },
    };
    Game.network.sendPacket(packet);

    return [world, state];
  });
};
