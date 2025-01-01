import { log, LogApp, LogLevel } from '@shared';
import {
  AppDataSource,
  Item,
  publishUserInventoryUpdate,
  UserInventoryItem,
  WorldBuilding,
  WorldBuildingInventory,
} from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestPlaceBuildingPacketData, syncRemoveEntities, syncServerEntities } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';

import worldBuildingChangeOutput from './request_world_building_change_output';
import { createNewBuildingEntity, Resource, SerializationID, serializeConfig } from '@virtcon2/network-world-entities';
import { defineQuery, defineSerializer, removeEntity } from '@virtcon2/bytenetc';

export default async function requestPlaceBuildingPacket(
  packet: ClientPacketWithSender<RequestPlaceBuildingPacketData>,
  client: RedisClientType,
) {
  // get the sender
  const player_id = packet.sender.id;
  // check if player has the item
  const inventoryItem = await UserInventoryItem.findOne({ where: { user: { id: player_id }, item: { id: packet.data.buildingItemId } } });
  if (!inventoryItem) {
    log(`Player ${player_id} does not have item ${packet.data.buildingItemId}`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }
  const item = await Item.findOne({
    where: { id: packet.data.buildingItemId },
    relations: ['building', 'building.items_to_be_placed_on', 'building.item'],
  });

  /* Check if position is occupied */
  const occuping_building = await WorldBuilding.findOne({ where: { x: packet.data.x, y: packet.data.y, world: { id: packet.world_id } } });
  if (occuping_building) {
    log(
      `Player ${player_id} tried to place item ${packet.data.buildingItemId} on occupied position ${packet.data.x}, ${packet.data.y}`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  const newWorldBuilding = {
    x: packet.data.x,
    y: packet.data.y,
    building: item.building,
    active: true,
    rotation: packet.data.rotation,
    world: { id: packet.world_id },
  };

  /* Add the building to the database */
  const worldBuilding = WorldBuilding.create({ ...newWorldBuilding });
  await worldBuilding.save();

  // Create all the slots
  for (let i = 0; i < item.building.inventory_slots; i++) {
    const inventoryItem = WorldBuildingInventory.create();
    inventoryItem.world_building = worldBuilding;
    inventoryItem.quantity = 0;
    inventoryItem.slot = i;
    inventoryItem.item = null;
    await inventoryItem.save();
  }

  /* Remove the item from players inventory */
  await AppDataSource.transaction(async (transaction) =>
    UserInventoryItem.addToInventory(transaction, player_id, packet.data.buildingItemId, -1).then(() =>
      publishUserInventoryUpdate(player_id),
    ),
  );

  // Update the output of the buildings that are next to the new building
  const positionsThatBuildingOccupies: [number, number][] = [];
  for (let i = 0; i < item.building.width; i++) {
    for (let j = 0; j < item.building.height; j++) {
      positionsThatBuildingOccupies.push([packet.data.x + i, packet.data.y + j]);
    }
  }

  positionsThatBuildingOccupies.forEach(async (position) => {
    const [x, y] = position;
    const wb = await WorldBuilding.findOne({ where: { output_pos_x: x, output_pos_y: y, world: { id: packet.world_id } } });
    if (wb) {
      worldBuildingChangeOutput({ ...packet, data: { building_id: wb.id, output_pos_x: x, output_pos_y: y } });
    }
  });

  switch (newWorldBuilding.rotation) {
    case 0:
      worldBuildingChangeOutput({
        ...packet,
        data: { building_id: worldBuilding.id, output_pos_x: newWorldBuilding.x + item.building.width, output_pos_y: newWorldBuilding.y },
      });
      break;
    case 90:
      worldBuildingChangeOutput({
        ...packet,
        data: { building_id: worldBuilding.id, output_pos_x: newWorldBuilding.x, output_pos_y: newWorldBuilding.y + item.building.height },
      });
      break;
    case 180:
      worldBuildingChangeOutput({
        ...packet,
        data: { building_id: worldBuilding.id, output_pos_x: newWorldBuilding.x - item.building.width, output_pos_y: newWorldBuilding.y },
      });
      break;
    case 270:
      worldBuildingChangeOutput({
        ...packet,
        data: { building_id: worldBuilding.id, output_pos_x: newWorldBuilding.x, output_pos_y: newWorldBuilding.y - item.building.height },
      });
      break;
  }

  const updatedWorldBuilding = await WorldBuilding.findOne({ where: { id: worldBuilding.id }, relations: ['building'] });

  const buildingEntityId = createNewBuildingEntity(packet.world_id, {
    buildingId: updatedWorldBuilding.building.id,
    worldBuildingId: updatedWorldBuilding.id,
    x: updatedWorldBuilding.x,
    y: updatedWorldBuilding.y,
    rotation: updatedWorldBuilding.rotation,
    outputX: updatedWorldBuilding.output_pos_x,
    outputY: updatedWorldBuilding.output_pos_y,
  });

  const serialize = defineSerializer(serializeConfig[SerializationID.BUILDING_FULL_SERVER]);

  const serializedBuilding = serialize(packet.world_id, [buildingEntityId]);

  return syncServerEntities(client, packet.world_id, packet.world_id, serializedBuilding, SerializationID.BUILDING_FULL_SERVER);
}
