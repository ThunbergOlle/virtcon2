import { log, LogApp, LogLevel } from '@shared';
import { User, World } from '@virtcon2/database-postgres';
import {
  ClientPacket,
  enqueuePacket,
  LoadWorldPacketData,
  PacketType,
  RequestJoinPacketData,
  syncServerEntities,
  SyncServerEntityPacket,
} from '@virtcon2/network-packet';

import { createNewPlayerEntity, Player, playerEntityComponents, SerializationID, serializeConfig } from '@virtcon2/network-world-entities';
import { defineQuery, defineSerializer } from 'bitecs';
import { RedisClientType } from 'redis';
import { getEntityWorld, loadEntitiesIntoMemory, serializeEntityWorld } from '../../ecs/entityWorld';
import { SERVER_SENDER } from '../utils';

const playerQuery = defineQuery(playerEntityComponents);

export default async function requestJoinPacket(packet: ClientPacket<RequestJoinPacketData>, client: RedisClientType) {
  /* Check if world is currently running in Redis */
  const dbWorld = await World.findOne({ where: { id: packet.world_id } });
  if (!dbWorld) return log(`World ${packet.world_id} does not exist.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);

  if (!getEntityWorld(packet.world_id)) {
    log(`World ${packet.world_id} is not running. Starting up world...`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
    try {
      await loadEntitiesIntoMemory(packet.world_id);
    } catch (e) {
      log(e, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return log(`Failed to start world ${packet.world_id}.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    }
  } else log(`World ${packet.world_id} is already running.`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);

  const serializeWorld = serializeEntityWorld(packet.world_id);

  await enqueuePacket<SyncServerEntityPacket>(client, packet.world_id, {
    packet_type: PacketType.SYNC_SERVER_ENTITY,
    target: packet.data.socket_id,
    data: {
      serializationId: SerializationID.WORLD,
      buffer: serializeWorld,
    },
    sender: SERVER_SENDER,
  });

  const world = getEntityWorld(packet.world_id);

  const user = await User.findOne({ where: { token: packet.data.token } });
  if (!user) return log(`User with token ${packet.data.token} does not exist.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
  user.currentlyInWorld = packet.world_id;
  await user.save();

  // check if user is already in the world

  const allPlayerEid = playerQuery(world, true);

  console.log(allPlayerEid);

  const existingPlayer = allPlayerEid.find((eid) => Player.userId[eid] === user.id);
  if (existingPlayer !== undefined) log(`Player entity already exists for user ${user.id}`, LogLevel.WARN, LogApp.PACKET_DATA_SERVER);

  const newPlayerEntity =
    existingPlayer ||
    createNewPlayerEntity(world, {
      userId: user.id,
      name: user.display_name,
      position: [0, 0],
    });

  await enqueuePacket<LoadWorldPacketData>(client, packet.world_id, {
    packet_type: PacketType.LOAD_WORLD,
    target: packet.data.socket_id,
    data: {
      id: dbWorld.id,
      heightMap: World.Get2DWorldMap(dbWorld.seed),
      mainPlayerId: user.id,
    },
    sender: SERVER_SENDER,
  });

  const serialize = defineSerializer(serializeConfig[SerializationID.PLAYER_FULL_SERVER]);

  const serializedPlayer = serialize(allPlayerEid);

  log(
    `Player ${user.display_name} joined world ${dbWorld.id} It has player entities ${allPlayerEid} and new player entity ${newPlayerEntity}`,
    LogLevel.INFO,
    LogApp.PACKET_DATA_SERVER,
  );

  return syncServerEntities(client, packet.world_id, packet.world_id, serializedPlayer, SerializationID.PLAYER_FULL_SERVER);
}
