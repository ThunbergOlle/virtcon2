import {
  InternalWorldBuildingFinishedProcessing,
  ClientPacket,
  ClientPacketWithSender,
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
import { log, LogLevel, ServerPlayer } from '@shared';

interface ClientPacketWithPotentialSender<T> extends ClientPacket<T> {
  sender?: ServerPlayer;
}

export default function handlePacket(packet: ClientPacketWithPotentialSender<unknown>, client: RedisClientType) {
  switch (packet.packet_type) {
    case PacketType.REQUEST_PLAYER_INVENTORY:
      return request_player_inventory_packet(packet as ClientPacketWithSender<RequestPlayerInventoryPacket>, client);
    case PacketType.REQUEST_JOIN:
      return request_join_packet(packet as ClientPacket<RequestJoinPacketData>, client);
    case PacketType.REQUEST_DESTROY_RESOURCE:
      return request_destroy_resource_packet(packet as ClientPacketWithSender<RequestDestroyResourcePacket>);
    case PacketType.REQUEST_PLACE_BUILDING:
      return request_place_building_packet(packet as ClientPacketWithSender<RequestPlaceBuildingPacketData>, client);
    case PacketType.REQUEST_WORLD_BUILDING:
      return request_world_building_packet(packet as ClientPacketWithSender<RequestWorldBuildingPacket>, client);
    case PacketType.REQUEST_WORLD_BUILDING_CHANGE_OUTPUT:
      return request_world_building_change_output(packet as ClientPacketWithSender<RequestWorldBuildingChangeOutput>, client);
    case PacketType.REQUEST_MOVE_INVENTORY_ITEM:
      return request_move_inventory_item_packet(packet as ClientPacketWithSender<RequestMoveInventoryItemPacketData>, client);
    case PacketType.INTERNAL_WORLD_BUILDING_FINISHED_PROCESSING:
      return internal_world_building_finished_processing_packet(packet as ClientPacket<InternalWorldBuildingFinishedProcessing>, client);
    default: {
      log(`Unknown packet type: ${packet.packet_type}`, LogLevel.ERROR);
      break;
    }
  }
}
