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

import { createNewPlayerEntity, Player, SerializationID, serializeConfig } from '@virtcon2/network-world-entities';
import { defineQuery, defineSerializer } from 'bitecs';
import { RedisClientType } from 'redis';
import { getEntityWorld, loadEntitiesIntoMemory, serializeEntityWorld, worlds } from '../../ecs/entityWorld';
import { SERVER_SENDER } from '../utils';

const playersInWorld = defineQuery([Player]);

export default async function requestJoinPacket(packet: ClientPacket<RequestJoinPacketData>, client: RedisClientType) {
  /* Check if world is currently running in Redis */
  const world = await World.findOne({ where: { id: packet.world_id } });
  if (!world) return log(`World ${packet.world_id} does not exist.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);

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

  const user = await User.findOne({ where: { token: packet.data.token } });
  user.currentlyInWorld = packet.world_id;
  await user.save();

  // check if user is already in the world
  const allPlayerEid = playersInWorld(getEntityWorld(packet.world_id));

  const existingPlayer = allPlayerEid.find((eid) => Player.userId[eid] === user.id);

  const playerEntityId =
    existingPlayer ||
    createNewPlayerEntity(worlds[packet.world_id], {
      userId: user.id,
      name: user.display_name,
      position: [0, 0],
    });

  await enqueuePacket<LoadWorldPacketData>(client, packet.world_id, {
    packet_type: PacketType.LOAD_WORLD,
    target: packet.data.socket_id,
    data: {
      id: world.id,
      heightMap: World.Get2DWorldMap(world.seed),
      mainPlayerId: user.id,
    },
    sender: SERVER_SENDER,
  });

  const serialize = defineSerializer(serializeConfig[SerializationID.PLAYER_FULL_SERVER]);

  const serializedPlayer = serialize(allPlayerEid);

  syncServerEntities(client, packet.world_id, packet.world_id, serializedPlayer, SerializationID.PLAYER_FULL_SERVER);

  log(`Player ${user.display_name} joined world ${world.id}.`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
}
