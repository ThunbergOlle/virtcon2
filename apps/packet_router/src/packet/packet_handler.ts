import { log, LogLevel, RedisPlayer } from '@shared';
import {
  ClientPacket,
  ClientPacketWithSender,
  PacketType,
  PlayerSetPositionServerPaacket,
  RequestDestroyResourcePacket,
  RequestJoinPacketData,
  RequestMoveInventoryItemPacketData,
  RequestPlaceBuildingPacketData,
  RequestPlayerInventoryPacket,
  RequestWorldBuildingChangeOutput,
  RequestWorldBuildingPacket,
} from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import playerMovePacket from './packets/playerMovePacket';
import request_destroy_resource_packet from './packets/request_destroy_resource_packet';
import request_join_packet from './packets/request_join_packet';
import request_move_inventory_item_packet from './packets/request_move_inventory_item_packet';
import request_place_building_packet from './packets/request_place_building_packet';
import request_player_inventory_packet from './packets/request_player_inventory_packet';
import request_world_building_change_output from './packets/request_world_building_change_output';
import request_world_building_packet from './packets/request_world_building_packet';

interface ClientPacketWithPotentialSender<T> extends ClientPacket<T> {
  sender?: RedisPlayer;
}

export function handleClientPacket(packet: ClientPacketWithPotentialSender<unknown>, client: RedisClientType) {
  switch (packet.packet_type) {
    case PacketType.PLAYER_SET_POSITION:
      return playerMovePacket(packet as ClientPacketWithSender<PlayerSetPositionServerPaacket>, client);
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
    default: {
      log(`Unknown packet type: ${packet.packet_type}`, LogLevel.ERROR);
      break;
    }
  }
}
