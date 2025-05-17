import { InvalidStateError, log, LogApp, LogLevel } from '@shared';
import { User, World, WorldPlot } from '@virtcon2/database-postgres';
import {
  ClientPacketWithSender,
  enqueuePacket,
  LoadWorldPacketData,
  PacketType,
  RequestJoinPacketData,
  syncServerEntities,
  SyncServerEntityPacket,
} from '@virtcon2/network-packet';

import {
  createNewPlayerEntity,
  Player,
  playerEntityComponents,
  SerializationID,
  serializeConfig,
  toPhaserPos,
} from '@virtcon2/network-world-entities';

import { defineQuery, defineSerializer, serializeAllEntities } from '@virtcon2/bytenetc';
import { RedisClientType } from 'redis';
import { doesWorldExist, getWorldBounds, initializeWorld } from '../../ecs/entityWorld';
import { SERVER_SENDER } from '../utils';

const playerQuery = defineQuery(...playerEntityComponents);

export default async function requestJoinPacket(packet: ClientPacketWithSender<RequestJoinPacketData>, client: RedisClientType) {
  await ensureWorldIsRunning(packet.world_id);
  const plot = await WorldPlot.findOne({ where: { worldId: packet.world_id }, order: { startX: 'ASC', startY: 'ASC' } });

  if (!plot) throw new InvalidStateError(`World ${packet.world_id} does not have a plot assigned to it.`);

  const serializeWorld = serializeAllEntities(packet.world_id);

  const user = await User.findOne({ where: { token: packet.data.token } });
  if (!user) return log(`User with token ${packet.data.token} does not exist.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
  user.currentlyInWorld = packet.world_id;
  await user.save();

  const allPlayerEid = playerQuery(packet.world_id);
  const existingPlayer = allPlayerEid.find((eid) => Player.userId[eid] === user.id);
  if (existingPlayer !== undefined) throw new Error(`Player entity already exists for user ${user.id}`);

  const worldBounds = await getWorldBounds(packet.world_id);
  const centerX = Math.floor((worldBounds.startX + worldBounds.endX) / 2);
  const centerY = Math.floor((worldBounds.startY + worldBounds.endY) / 2);

  const { x, y } = toPhaserPos({ x: centerX, y: centerY });

  const joinedPlayerEntity = createNewPlayerEntity(packet.world_id, {
    userId: user.id,
    name: user.display_name,
    position: [x, y],
  });

  const serialize = defineSerializer(serializeConfig[SerializationID.PLAYER_FULL_SERVER]);
  const serializedPlayer = serialize(packet.world_id, [joinedPlayerEntity]);

  await enqueuePacket<LoadWorldPacketData>(client, packet.world_id, {
    packet_type: PacketType.LOAD_WORLD,
    target: packet.sender.socket_id,
    data: {
      id: packet.world_id,
      mainPlayerId: user.id,
    },
    sender: SERVER_SENDER,
  });

  await enqueuePacket<SyncServerEntityPacket>(client, packet.world_id, {
    packet_type: PacketType.SYNC_SERVER_ENTITY,
    target: packet.data.socket_id,
    data: {
      serializationId: SerializationID.WORLD,
      data: serializeWorld,
    },
    sender: SERVER_SENDER,
  });
  syncServerEntities(client, packet.world_id, packet.world_id, serializedPlayer, SerializationID.PLAYER_FULL_SERVER);

  return;
}

const ensureWorldIsRunning = async (worldId: string) => {
  /* Check if world is currently running in Redis */
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
