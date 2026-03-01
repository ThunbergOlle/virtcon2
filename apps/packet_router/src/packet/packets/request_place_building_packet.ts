import { log, LogApp, LogLevel } from '@shared';
import {
  AppDataSource,
  AssemblerWorldBuilding,
  Item,
  publishUserInventoryUpdate,
  UserInventoryItem,
  WorldBuilding,
  WorldBuildingInventory,
  WorldResource,
} from '@virtcon2/database-postgres';
import { DBItemName, get_building_by_id } from '@virtcon2/static-game-data';
import { Between } from 'typeorm';
import { ClientPacketWithSender, RequestPlaceBuildingPacketData } from '@virtcon2/network-packet';

import {
  createNewBuildingEntity,
  fromPhaserPos,
  getSerializeConfig,
  Position,
  Resource,
  SerializationID,
} from '@virtcon2/network-world-entities';
import { defineQuery, defineSerializer, Entity, removeEntity, World } from '@virtcon2/bytenetc';
import { syncRemoveEntities, syncServerEntities } from '../enqueue';

export default async function requestPlaceBuildingPacket(packet: ClientPacketWithSender<RequestPlaceBuildingPacketData>) {
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

  /* Check if position is occupied (AABB multi-tile check) */
  const buildingDef = get_building_by_id(item.building.id);
  const newW = buildingDef?.width ?? 1;
  const newH = buildingDef?.height ?? 1;
  const MAX_BUILDING_SPAN = 5;

  const nearbyBuildings = await WorldBuilding.find({
    where: {
      world: { id: packet.world_id },
      x: Between(packet.data.x - MAX_BUILDING_SPAN + 1, packet.data.x + newW - 1),
      y: Between(packet.data.y - MAX_BUILDING_SPAN + 1, packet.data.y + newH - 1),
    },
    relations: ['building'],
  });

  for (const existing of nearbyBuildings) {
    const existingW = existing.building.width ?? 1;
    const existingH = existing.building.height ?? 1;
    const overlaps =
      packet.data.x < existing.x + existingW &&
      packet.data.x + newW > existing.x &&
      packet.data.y < existing.y + existingH &&
      packet.data.y + newH > existing.y;
    if (overlaps) {
      log(
        `Player ${player_id} tried to place item ${packet.data.buildingItemId} on occupied tiles at ${packet.data.x}, ${packet.data.y}`,
        LogLevel.ERROR,
        LogApp.PACKET_DATA_SERVER,
      );
      return;
    }
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
  for (let i = 0; i < item.building.inventory_slots.length; i++) {
    const inventoryItem = WorldBuildingInventory.create();
    inventoryItem.world_building = worldBuilding;
    inventoryItem.quantity = 0;
    inventoryItem.slot = i;
    inventoryItem.slotType = item.building.inventory_slots[i];
    inventoryItem.item = null;
    await inventoryItem.save();
  }

  const resource = await WorldResource.findOne({ where: { world: { id: packet.world_id }, x: packet.data.x, y: packet.data.y } });

  if (resource) {
    resource.worldBuildingId = worldBuilding.id;
    await resource.save();
  }

  // Create AssemblerWorldBuilding record for assembler buildings
  if (item.building.name === DBItemName.BUILDING_ASSEMBLER) {
    const awb = AssemblerWorldBuilding.create({ worldBuildingId: worldBuilding.id, outputItemId: null, progressTicks: 0 });
    await awb.save();
  }

  /* Remove the item from players inventory */
  await AppDataSource.transaction(async (transaction) =>
    UserInventoryItem.addToInventory(transaction, player_id, packet.data.buildingItemId, -1).then(() =>
      publishUserInventoryUpdate(player_id),
    ),
  );

  const updatedWorldBuilding = await WorldBuilding.findOne({ where: { id: worldBuilding.id }, relations: ['building'] });

  const buildingEntityId = createNewBuildingEntity(packet.world_id, {
    buildingId: updatedWorldBuilding.building.id,
    worldBuildingId: updatedWorldBuilding.id,
    x: updatedWorldBuilding.x,
    y: updatedWorldBuilding.y,
    rotation: updatedWorldBuilding.rotation,
  });

  deleteResource(packet.world_id, buildingEntityId);

  const serialize = defineSerializer(getSerializeConfig(packet.world_id)[SerializationID.BUILDING_FULL_SERVER]);
  const serializedBuilding = serialize(packet.world_id, [buildingEntityId]);

  return syncServerEntities(packet.world_id, serializedBuilding, SerializationID.BUILDING_FULL_SERVER);
}

const deleteResource = (world: World, buildingId: Entity) => {
  const resourceQuery = defineQuery(Resource, Position);

  const { x, y } = fromPhaserPos({ x: Position(world).x[buildingId], y: Position(world).y[buildingId] });
  const resourceEntities = resourceQuery(world);
  for (let i = 0; i < resourceEntities.length; i++) {
    const resourceEid = resourceEntities[i];
    const { x: resourceX, y: resourceY } = fromPhaserPos({ x: Position(world).x[resourceEid], y: Position(world).y[resourceEid] });
    if (resourceX === x && resourceY === y) {
      syncRemoveEntities(world, [removeEntity(world, resourceEid)]);
      break;
    }
  }
};
