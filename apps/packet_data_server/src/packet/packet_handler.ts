import { NetworkPacketData, NetworkPacketDataWithSender, PacketType, RequestDestroyResourcePacket, RequestJoinPacketData, RequestPlayerInventoryPacket } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import request_player_inventory_packet from './packets/request_player_inventory_packet';
import request_join_packet from './packets/request_join_packet';
import request_destroy_resource_packet from './packets/request_destroy_resource_packet';

export default function packet_handler(packet: NetworkPacketData<unknown>, redisPubClient: RedisClientType) {
  switch (packet.packet_type) {
    case PacketType.REQUEST_PLAYER_INVENTORY: {
      request_player_inventory_packet(packet as NetworkPacketData<RequestPlayerInventoryPacket>, redisPubClient);
      break;
    }
    case PacketType.REQUEST_JOIN: {
      request_join_packet(packet as NetworkPacketData<RequestJoinPacketData>, redisPubClient);
      break;
    }
    case PacketType.REQUEST_DESTROY_RESOURCE: {
      request_destroy_resource_packet(packet as NetworkPacketDataWithSender<RequestDestroyResourcePacket>);
      break;
    }
    default: {
      break;
    }
  }
}
