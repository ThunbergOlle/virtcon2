import { log, LogLevel } from '@shared';
import {
  ClientPacket,
  ClientPacketWithSender,
  CreateConnectionPointPacket,
  PacketSender,
  PacketType,
  RequestDestroyResourcePacket,
  RequestJoinPacketData,
  RequestMoveInventoryItemPacketData,
  RequestPickupItemPacketData,
  RequestPlaceBuildingPacketData,
  SyncClientEntityPacket,
} from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';
import syncClientEntityPacket from './enqueue';
import { requestCreateConnectionPoint } from './packets/requestCreateConnectionPoint';
import requestPickupItemPacket from './packets/requestPickupItemPacket';
import request_destroy_resource_packet from './packets/request_destroy_resource_packet';
import requestJoinPacket from './packets/request_join_packet';
import request_move_inventory_item_packet from './packets/request_move_inventory_item_packet';
import requestPlaceBuildingPacket from './packets/request_place_building_packet';

interface ClientPacketWithPotentialSender<T> extends ClientPacket<T> {
  sender?: PacketSender;
}

export function handleClientPacket(packet: ClientPacketWithPotentialSender<unknown>) {
  switch (packet.packet_type) {
    case PacketType.REQUEST_JOIN:
      return requestJoinPacket(packet as ClientPacketWithSender<RequestJoinPacketData>);
    case PacketType.REQUEST_DESTROY_RESOURCE:
      return request_destroy_resource_packet(packet as ClientPacketWithSender<RequestDestroyResourcePacket>);
    case PacketType.REQUEST_PLACE_BUILDING:
      return requestPlaceBuildingPacket(packet as ClientPacketWithSender<RequestPlaceBuildingPacketData>);
    case PacketType.REQUEST_MOVE_INVENTORY_ITEM:
      return request_move_inventory_item_packet(packet as ClientPacketWithSender<RequestMoveInventoryItemPacketData>);
    case PacketType.SYNC_CLIENT_ENTITY:
      return syncClientEntityPacket(packet as ClientPacketWithSender<SyncClientEntityPacket>);
    case PacketType.REQUEST_CREATE_CONNECTION_POINT:
      return requestCreateConnectionPoint(packet as ClientPacketWithSender<CreateConnectionPointPacket>);
    case PacketType.REQUEST_PICKUP_ITEM:
      return requestPickupItemPacket(packet as ClientPacketWithSender<RequestPickupItemPacketData>);

    default: {
      log(`Unknown packet type: ${packet.packet_type}`, LogLevel.ERROR);
      break;
    }
  }
}
