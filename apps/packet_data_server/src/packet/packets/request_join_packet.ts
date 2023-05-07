import { RedisClientType } from 'redis';
import { User } from '@virtcon2/database-postgres';
import { JoinPacketData, NetworkPacketData, PacketType, RedisPacketPublisher, RequestJoinPacketData } from '@virtcon2/network-packet';
import { LogApp, LogLevel, RedisWorld, log } from '@shared';
import { worldService } from '@virtcon2/database-redis';

export default async function request_join_packet(packet: NetworkPacketData<RequestJoinPacketData>, redisPubClient: RedisClientType) {
  /* Check if world is currently running in Redis */
  const world = (await redisPubClient.json.get(`worlds`, {
    path: `$.${packet.world_id}`,
  })) as RedisWorld[];

  if (!world.length) {
    log(`World ${packet.world_id} is not running. Starting up world...`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
    /* Create a new world in the redis database */
    const new_world: RedisWorld = {
      id: packet.world_id,
      players: [],
      buildings: [],
    };
    await worldService.startWorldProcess(new_world, redisPubClient);
  }
  // get player inventory from database.
  const player = await User.findOne({ where: { token: packet.data.token } });
  // construct a JoinPacket
  const join_packet = new RedisPacketPublisher(redisPubClient)
    .packet_type(PacketType.JOIN)
    .data({ id: player.id, name: player.display_name, world_id: packet.world_id, socket_id: packet.data.socket_id, position: [0, 0] } as JoinPacketData)
    .target(packet.data.socket_id)
    .channel(packet.world_id)
    .build();

  // publish the packet
  await join_packet.publish();
}
