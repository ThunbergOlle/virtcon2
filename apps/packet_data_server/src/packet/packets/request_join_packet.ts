import { LogApp, LogLevel, RedisWorld, log } from '@shared';
import { User } from '@virtcon2/database-postgres';
import { worldService } from '@virtcon2/database-redis';
import { JoinPacketData, NetworkPacketData, PacketType, RedisPacketPublisher, RequestJoinPacketData } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';

export default async function request_join_packet(packet: NetworkPacketData<RequestJoinPacketData>, redisPubClient: RedisClientType) {
  /* Check if world is currently running in Redis */
  const world = (await redisPubClient.json.get(`worlds`, {
    path: `$.${packet.world_id}`,
  })) as unknown as Array<RedisWorld>;
  if (!world.length) {
    log(`World ${packet.world_id} is not running. Starting up world...`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
    try {
      const loaded_world = await worldService.loadWorld(packet.world_id);
      await worldService.startWorldProcess(loaded_world, redisPubClient);
    } catch (e) {
      return log(`Failed to start world ${packet.world_id}.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    }
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
  if (world.length) {
    await join_packet.publish();
  } else {
    // note: this is not ideal, but it works for now.
    setTimeout(() => {
      // wait for rust process to start.
      join_packet.publish();
    }, 800);
  }
}
