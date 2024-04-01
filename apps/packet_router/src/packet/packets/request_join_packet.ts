import { log, LogApp, LogLevel } from '@shared';
import { User, World } from '@virtcon2/database-postgres';
import { ClientPacket, enqueuePacket, LoadWorldPacketData, PacketType, RequestJoinPacketData } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import { getEntityWorld, loadEntitiesIntoMemory, serializeEntityWorld } from '../../ecs/entityWorld';
import { SERVER_SENDER } from '../utils';

export default async function request_join_packet(packet: ClientPacket<RequestJoinPacketData>, client: RedisClientType) {
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

  await enqueuePacket(client, packet.world_id, {
    packet_type: PacketType.SYNC_SERVER_ENTITY,
    target: packet.data.socket_id,
    data: serializeWorld,
    sender: SERVER_SENDER,
  });

  await enqueuePacket<LoadWorldPacketData>(client, packet.world_id, {
    packet_type: PacketType.LOAD_WORLD,
    target: packet.data.socket_id,
    data: {
      id: world.id,
      heightMap: World.Get2DWorldMap(world.seed),
    },
    sender: SERVER_SENDER,
  });

  // get player inventory from database.
  const player = await User.findOne({ where: { token: packet.data.token } });

  log(`Player ${player.id} joined world ${packet.world_id}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
}
