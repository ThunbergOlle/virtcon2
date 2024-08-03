import { log, LogApp, LogLevel } from '@shared';
import { Item, UserInventoryItem, WorldBuilding, WorldBuildingInventory, WorldResource } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestPlaceBuildingPacketData, syncServerEntities } from '@virtcon2/network-packet';
import { RedisClientType } from 'redis';

import requestWorldBuldingChangeOutput from './request_world_building_change_output';
import { createNewBuildingEntity, SerializationID, serializeConfig } from '@virtcon2/network-world-entities';
import { defineSerializer } from '@virtcon2/bytenetc';

export default async function request_place_building_packet(packet: ClientPacketWithSender<RequestPlaceBuildingPacketData>, client: RedisClientType) {
  // get the sender
  const player_id = packet.sender.id;
  // check if player has the item
  const inventoryItem = await UserInventoryItem.findOne({ where: { user: { id: player_id }, item: { id: packet.data.buildingItemId } } });
  if (!inventoryItem) {
    log(`Player ${player_id} does not have item ${packet.data.buildingItemId}`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }
  const item = await Item.findOne({ where: { id: packet.data.buildingItemId }, relations: ['building', 'building.items_to_be_placed_on', 'building.item'] });
  /* Get if there are any resources at the coordinates. */
  const resource = await WorldResource.findOne({ where: { x: packet.data.x, y: packet.data.y, world: { id: packet.world_id } }, relations: ['item'] });

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
  const isActive = item.building.items_to_be_placed_on ? item.building.items_to_be_placed_on?.find((i) => i.id === resource?.item.id) && true : true;

  const newWorldBuilding = {
    x: packet.data.x,
    y: packet.data.y,
    building: item.building,
    world_resource: resource,
    active: isActive,
    rotation: packet.data.rotation,
    world: { id: packet.world_id },
  };

  /* Add the building to the database */
  const worldBuilding = WorldBuilding.create({ ...newWorldBuilding });
  await worldBuilding.save();

  if (resource !== null) {
    resource.world_building = worldBuilding;
    await resource.save();
  }
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
  await UserInventoryItem.addToInventory(player_id, packet.data.buildingItemId, -1);

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
      requestWorldBuldingChangeOutput({ ...packet, data: { building_id: wb.id, output_pos_x: x, output_pos_y: y } });
    }
  });

  const rotation = Math.round((newWorldBuilding.rotation * 180) / Math.PI); // convert radians to degrees because float is not precise enough

  switch (rotation) {
    case 0:
      requestWorldBuldingChangeOutput({
        ...packet,
        data: { building_id: worldBuilding.id, output_pos_x: newWorldBuilding.x + item.building.width, output_pos_y: newWorldBuilding.y },
      });
      break;
    case 90:
      requestWorldBuldingChangeOutput({
        ...packet,
        data: { building_id: worldBuilding.id, output_pos_x: newWorldBuilding.x, output_pos_y: newWorldBuilding.y + item.building.height },
      });
      break;
    case 180:
      requestWorldBuldingChangeOutput({
        ...packet,
        data: { building_id: worldBuilding.id, output_pos_x: newWorldBuilding.x - item.building.width, output_pos_y: newWorldBuilding.y },
      });
      break;
    case 270:
      requestWorldBuldingChangeOutput({
        ...packet,
        data: { building_id: worldBuilding.id, output_pos_x: newWorldBuilding.x, output_pos_y: newWorldBuilding.y - item.building.height },
      });
      break;
  }

  const buildingEntityId = createNewBuildingEntity(packet.world_id, {
    buildingId: worldBuilding.building.id,
    worldBuildingId: worldBuilding.id,
    x: worldBuilding.x,
    y: worldBuilding.y,
    rotation: worldBuilding.rotation,
  });

  const serialize = defineSerializer(serializeConfig[SerializationID.BUILDING_FULL_SERVER]);

  const serializedBuilding = serialize(packet.world_id, [buildingEntityId]);

  return syncServerEntities(client, packet.world_id, packet.world_id, serializedBuilding, SerializationID.BUILDING_FULL_SERVER);
}
