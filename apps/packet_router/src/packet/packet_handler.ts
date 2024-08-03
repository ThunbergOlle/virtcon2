import { log, LogLevel } from '@shared';
import {
  ClientPacket,
  ClientPacketWithSender,
  PacketSender,
  PacketType,
  RequestDestroyResourcePacket,
  RequestJoinPacketData,
  RequestMoveInventoryItemPacketData,
  RequestPlaceBuildingPacketData,
  RequestWorldBuildingChangeOutput,
  SyncClientEntityPacket,
} from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import request_destroy_resource_packet from './packets/request_destroy_resource_packet';
import requestJoinPacket from './packets/request_join_packet';
import request_move_inventory_item_packet from './packets/request_move_inventory_item_packet';
import request_place_building_packet from './packets/request_place_building_packet';
import requestWorldBuldingChangeOutput from './packets/request_world_building_change_output';
import syncClientEntity from './packets/syncClientEntity';

interface ClientPacketWithPotentialSender<T> extends ClientPacket<T> {
  sender?: PacketSender;
}

export function handleClientPacket(packet: ClientPacketWithPotentialSender<unknown>, client: RedisClientType) {
  switch (packet.packet_type) {
    case PacketType.REQUEST_JOIN:
      return requestJoinPacket(packet as ClientPacketWithSender<RequestJoinPacketData>, client);
    case PacketType.REQUEST_DESTROY_RESOURCE:
      return request_destroy_resource_packet(packet as ClientPacketWithSender<RequestDestroyResourcePacket>);
    case PacketType.REQUEST_PLACE_BUILDING:
      return request_place_building_packet(packet as ClientPacketWithSender<RequestPlaceBuildingPacketData>, client);
    case PacketType.REQUEST_WORLD_BUILDING_CHANGE_OUTPUT:
      return requestWorldBuldingChangeOutput(packet as ClientPacketWithSender<RequestWorldBuildingChangeOutput>);
    case PacketType.REQUEST_MOVE_INVENTORY_ITEM:
      return request_move_inventory_item_packet(packet as ClientPacketWithSender<RequestMoveInventoryItemPacketData>);
    case PacketType.SYNC_CLIENT_ENTITY:
      return syncClientEntity(packet as ClientPacketWithSender<SyncClientEntityPacket>, client);

    default: {
      log(`Unknown packet type: ${packet.packet_type}`, LogLevel.ERROR);
      break;
    }
  }
}
