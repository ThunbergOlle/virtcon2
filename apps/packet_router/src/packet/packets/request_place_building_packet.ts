import { log, LogApp, LogLevel } from '@shared';
import {
  AppDataSource,
  Item,
  publishUserInventoryUpdate,
  UserInventoryItem,
  WorldBuilding,
  WorldBuildingInventory,
} from '@virtcon2/database-postgres';
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
