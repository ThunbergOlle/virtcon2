import { log, LogLevel } from '@shared';
import {
  ClientPacket,
  ClientPacketWithSender,
  PacketSender,
  PacketType,
  RequestDestroyHarvestablePacket,
  RequestDestroyResourcePacket,
  RequestDropItemPacketData,
  RequestJoinPacketData,
  RequestMoveInventoryItemPacketData,
  RequestPickupItemPacketData,
  RequestPlaceBuildingPacketData,
  RequestPlaceHarvestablePacketData,
  RequestPickupBuildingPacketData,
  RequestSetAssemblerOutputPacketData,
  SyncClientEntityPacket,
} from '@virtcon2/network-packet';
import syncClientEntityPacket from './enqueue';
import requestDropItemPacket from './packets/requestDropItemPacket';
import requestPickupItemPacket from './packets/requestPickupItemPacket';
import request_destroy_harvestable_packet from './packets/request_destroy_harvestable_packet';
import request_destroy_resource_packet from './packets/request_destroy_resource_packet';
import requestJoinPacket from './packets/request_join_packet';
import request_move_inventory_item_packet from './packets/request_move_inventory_item_packet';
import requestPlaceBuildingPacket from './packets/request_place_building_packet';
import requestPlaceHarvestablePacket from './packets/request_place_harvestable_packet';
import requestPickupBuildingPacket from './packets/request_pickup_building_packet';
import requestSetAssemblerOutputPacket from './packets/request_set_assembler_output_packet';

interface ClientPacketWithPotentialSender<T> extends ClientPacket<T> {
  sender?: PacketSender;
}

export function handleClientPacket(packet: ClientPacketWithPotentialSender<unknown>) {
  switch (packet.packet_type) {
    case PacketType.REQUEST_JOIN:
      return requestJoinPacket(packet as ClientPacketWithSender<RequestJoinPacketData>);
    case PacketType.REQUEST_DESTROY_RESOURCE:
      return request_destroy_resource_packet(packet as ClientPacketWithSender<RequestDestroyResourcePacket>);
    case PacketType.REQUEST_DESTROY_HARVESTABLE:
      return request_destroy_harvestable_packet(packet as ClientPacketWithSender<RequestDestroyHarvestablePacket>);
    case PacketType.REQUEST_PLACE_BUILDING:
      return requestPlaceBuildingPacket(packet as ClientPacketWithSender<RequestPlaceBuildingPacketData>);
    case PacketType.REQUEST_MOVE_INVENTORY_ITEM:
      return request_move_inventory_item_packet(packet as ClientPacketWithSender<RequestMoveInventoryItemPacketData>);
    case PacketType.SYNC_CLIENT_ENTITY:
      return syncClientEntityPacket(packet as ClientPacketWithSender<SyncClientEntityPacket>);
    case PacketType.REQUEST_PICKUP_ITEM:
      return requestPickupItemPacket(packet as ClientPacketWithSender<RequestPickupItemPacketData>);
    case PacketType.REQUEST_DROP_ITEM:
      return requestDropItemPacket(packet as ClientPacketWithSender<RequestDropItemPacketData>);
    case PacketType.REQUEST_PLACE_HARVESTABLE:
      return requestPlaceHarvestablePacket(packet as ClientPacketWithSender<RequestPlaceHarvestablePacketData>);
    case PacketType.REQUEST_PICKUP_BUILDING:
      return requestPickupBuildingPacket(packet as ClientPacketWithSender<RequestPickupBuildingPacketData>);
    case PacketType.REQUEST_SET_ASSEMBLER_OUTPUT:
      return requestSetAssemblerOutputPacket(packet as ClientPacketWithSender<RequestSetAssemblerOutputPacketData>);

    default: {
      log(`Unknown packet type: ${packet.packet_type}`, LogLevel.ERROR);
      break;
    }
  }
}
