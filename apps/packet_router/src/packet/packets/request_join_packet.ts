import { LogApp, LogLevel, RedisWorld, RedisPlayer, log } from '@shared';
import { User } from '@virtcon2/database-postgres';
import { ClientPacket, JoinPacketData, LoadWorldPacketData, PacketType, RequestJoinPacketData, enqueuePacket } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import { SERVER_SENDER } from '../utils';
import Redis from '@virtcon2/database-redis';

export default async function request_join_packet(packet: ClientPacket<RequestJoinPacketData>, client: RedisClientType) {
  /* Check if world is currently running in Redis */
  const world = (await client.json.get(`worlds`, {
    path: `$.${packet.world_id}`,
  })) as unknown as Array<RedisWorld>;
  if (!world.length) {
    log(`World ${packet.world_id} is not running. Starting up world...`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
    try {
      await Redis.openWorld(packet.world_id, client);
    } catch (e) {
      log(e, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return log(`Failed to start world ${packet.world_id}.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    }
  } else log(`World ${packet.world_id} is already running.`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);

  // get player inventory from database.
  const player = await User.findOne({ where: { token: packet.data.token } });

  log(`Player ${player.id} joined world ${packet.world_id}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);

  const initialServerPlayerState: RedisPlayer = {
    id: player.id,
    name: player.display_name,
    world_id: packet.world_id,
    socket_id: packet.data.socket_id,
    position: [0, 0],
    inventory: [],
  };

  Redis.addPlayer(initialServerPlayerState, packet.world_id, client);

  await enqueuePacket<JoinPacketData>(client, packet.world_id, {
    packet_type: PacketType.JOIN,
    target: packet.world_id,
    data: initialServerPlayerState,
    sender: SERVER_SENDER,
  });

  await enqueuePacket<LoadWorldPacketData>(client, packet.world_id, {
    packet_type: PacketType.LOAD_WORLD,
    target: packet.data.socket_id,
    data: {
      player: initialServerPlayerState,
      world: await Redis.getWorld(packet.world_id, client),
    },
    sender: SERVER_SENDER,
  });
}
