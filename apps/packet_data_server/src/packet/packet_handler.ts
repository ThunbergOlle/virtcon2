import {
  InternalWorldBuildingFinishedProcessing,
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
import request_destroy_resource_packet from './packets/request_destroy_resource_packet';
import request_join_packet from './packets/request_join_packet';
import request_place_building_packet from './packets/request_place_building_packet';
import request_player_inventory_packet from './packets/request_player_inventory_packet';
import request_world_building_change_output from './packets/request_world_building_change_output';
import request_world_building_packet from './packets/request_world_building_packet';
import internal_world_building_finished_processing_packet from './packets/internal_world_building_finished_processing_packet';
import request_move_inventory_item_packet from './packets/request_move_inventory_item_packet';

export default function all_packet_handler(
  packet: NetworkPacketData<unknown>,
  redisPubClient: RedisClientType,
  packet_queue: NetworkPacketData<unknown>[],
) {
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
      packet_queue.push(packet);
      // request_move_inventory_item_packet(packet as NetworkPacketDataWithSender<RequestMoveInventoryItemPacketData>, redisPubClient);
      break;
    }
    case PacketType.REQUEST_WORLD_BUILDING_CHANGE_OUTPUT: {
      request_world_building_change_output(packet as NetworkPacketDataWithSender<RequestWorldBuildingChangeOutput>, redisPubClient);
      break;
    }
    case PacketType.INTERNAL_WORLD_BUILDING_FINISHED_PROCESSING: {
      packet_queue.push(packet);
      // internal_world_building_finished_processing_packet(packet as NetworkPacketData<InternalWorldBuildingFinishedProcessing>, redisPubClient);
      break;
    }
    default: {
      break;
    }
  }
}

export async function sync_packet_handler(
  packet: NetworkPacketData<unknown>,
  redisPubClient: RedisClientType,
) {
  switch (packet.packet_type) {
    case PacketType.REQUEST_MOVE_INVENTORY_ITEM: {
      await request_move_inventory_item_packet(packet as NetworkPacketDataWithSender<RequestMoveInventoryItemPacketData>, redisPubClient);
      break;
    }
    case PacketType.INTERNAL_WORLD_BUILDING_FINISHED_PROCESSING: {
      await internal_world_building_finished_processing_packet(packet as NetworkPacketData<InternalWorldBuildingFinishedProcessing>, redisPubClient);
      break;
    }
  }
}
