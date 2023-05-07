import { RedisClientType } from 'redis';
import { User } from '@virtcon2/database-postgres';
import { JoinPacketData, NetworkPacketData, PacketType, RedisPacketPublisher, RequestJoinPacketData } from '@virtcon2/network-packet';

export default async function request_join_packet(packet: NetworkPacketData<RequestJoinPacketData>, redisPubClient: RedisClientType) {
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
