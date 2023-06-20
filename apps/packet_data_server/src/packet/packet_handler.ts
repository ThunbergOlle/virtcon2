import {
  NetworkPacketData,
  NetworkPacketDataWithSender,
  PacketType,
  RequestDestroyResourcePacket,
  RequestJoinPacketData,
  RequestMoveInventoryItemPacketData,
  RequestPlaceBuildingPacketData,
  RequestPlayerInventoryPacket,
  RequestWorldBuildingChangeOutput,
  RequestWorldBuildingPacket,
} from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import request_player_inventory_packet from './packets/request_player_inventory_packet';
import request_join_packet from './packets/request_join_packet';
import request_destroy_resource_packet from './packets/request_destroy_resource_packet';
import request_place_building_packet from './packets/request_place_building_packet';
import request_world_building_packet from './packets/request_world_building_packet';
import request_move_inventory_item_packet from './packets/request_move_inventory_item_packet';
import request_world_building_change_output from './packets/request_world_building_change_output';

export default function packet_handler(packet: NetworkPacketData<unknown>, redisPubClient: RedisClientType) {
  switch (packet.packet_type) {
    case PacketType.REQUEST_PLAYER_INVENTORY: {
      request_player_inventory_packet(packet as NetworkPacketDataWithSender<RequestPlayerInventoryPacket>, redisPubClient);
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
    case PacketType.REQUEST_PLACE_BUILDING: {
      request_place_building_packet(packet as NetworkPacketDataWithSender<RequestPlaceBuildingPacketData>, redisPubClient);
      break;
    }
    case PacketType.REQUEST_WORLD_BUILDING: {
      request_world_building_packet(packet as NetworkPacketDataWithSender<RequestWorldBuildingPacket>, redisPubClient);
      break;
    }
    case PacketType.REQUEST_MOVE_INVENTORY_ITEM: {
      request_move_inventory_item_packet(packet as NetworkPacketDataWithSender<RequestMoveInventoryItemPacketData>, redisPubClient);
      break;
    }
    case PacketType.REQUEST_WORLD_BUILDING_CHANGE_OUTPUT: {
      request_world_building_change_output(packet as NetworkPacketDataWithSender<RequestWorldBuildingChangeOutput>, redisPubClient);
      break;
    }
    default: {
      break;
    }
  }
}
