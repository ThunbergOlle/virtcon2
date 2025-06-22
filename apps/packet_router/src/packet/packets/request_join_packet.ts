import { InvalidStateError, log, LogApp, LogLevel } from '@shared';
import { User, World, WorldPlot } from '@virtcon2/database-postgres';
import {
  ClientPacketWithSender,
  LoadWorldPacketData,
  PacketType,
  RequestJoinPacketData,
  SyncServerEntityPacket,
} from '@virtcon2/network-packet';

import {
  createNewPlayerEntity,
  getSerializeConfig,
  Player,
  playerEntityComponents,
  SerializationID,
  toPhaserPos,
} from '@virtcon2/network-world-entities';

import { defineQuery, defineSerializer, serializeAllEntities } from '@virtcon2/bytenetc';
import { doesWorldExist, getWorldBounds, initializeWorld, PLOT_SIZE } from '../../ecs/entityWorld';
import { SERVER_SENDER } from '../utils';
import { enqueuePacket, syncServerEntities } from '../enqueue';

export default async function requestJoinPacket(packet: ClientPacketWithSender<RequestJoinPacketData>) {
  await ensureWorldIsRunning(packet.world_id);
  const playerQuery = defineQuery(...playerEntityComponents);
  const plot = await WorldPlot.findOne({ where: { worldId: packet.world_id }, order: { x: 'ASC', y: 'ASC' } });

  if (!plot) throw new InvalidStateError(`World ${packet.world_id} does not have a plot assigned to it.`);

  const serializeWorld = serializeAllEntities(packet.world_id);

  const user = await User.findOne({ where: { token: packet.data.token } });
  if (!user) return log(`User with token ${packet.data.token} does not exist.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
  user.currentlyInWorld = packet.world_id;
  await user.save();

  const allPlayerEid = playerQuery(packet.world_id);
  const existingPlayer = allPlayerEid.find((eid) => Player(packet.world_id).userId[eid] === user.id);
  if (existingPlayer !== undefined) throw new Error(`Player entity already exists for user ${user.id}`);

  const worldBounds = await getWorldBounds(packet.world_id);
  const centerX = Math.floor((worldBounds[0].x + PLOT_SIZE) / 2);
  const centerY = Math.floor((worldBounds[0].y + PLOT_SIZE) / 2);

  const { x, y } = toPhaserPos({ x: centerX, y: centerY });

  const joinedPlayerEntity = createNewPlayerEntity(packet.world_id, {
    userId: user.id,
    name: user.display_name,
    position: [x, y],
  });

  const serialize = defineSerializer(getSerializeConfig(packet.world_id)[SerializationID.PLAYER_FULL_SERVER]);
  const serializedPlayer = serialize(packet.world_id, [joinedPlayerEntity]);

  await enqueuePacket<LoadWorldPacketData>({
    packet_type: PacketType.LOAD_WORLD,
    target: packet.sender.socket_id,
    data: {
      id: packet.world_id,
      mainPlayerId: user.id,
    },
    sender: SERVER_SENDER,
  });

  await enqueuePacket<SyncServerEntityPacket>({
    packet_type: PacketType.SYNC_SERVER_ENTITY,
    target: packet.data.socket_id,
    data: {
      serializationId: SerializationID.WORLD,
      data: serializeWorld,
    },
    sender: SERVER_SENDER,
  });
  await syncServerEntities(packet.world_id, serializedPlayer, SerializationID.PLAYER_FULL_SERVER);

  return;
}

const ensureWorldIsRunning = async (worldId: string) => {
  let dbWorld = await World.findOne({ where: { id: worldId } });
  if (!dbWorld) dbWorld = await World.GenerateNewWorld(worldId);

  if (!doesWorldExist(worldId)) {
    log(`World ${worldId} is not running. Starting up world...`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
    try {
      await initializeWorld(worldId);
    } catch (e) {
      log(e, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return log(`Failed to start world ${worldId}.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    }
  } else log(`World ${worldId} is already running.`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
};
