import { log, LogApp, LogLevel, TILE_TYPE } from '@shared';
import {
  AppDataSource,
  publishUserInventoryUpdate,
  UserInventoryItem,
  World,
  WorldBuilding,
  WorldHarvestable,
  WorldResource,
} from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestPlaceHarvestablePacketData } from '@virtcon2/network-packet';

import {
  createNewHarvestableEntity,
  getSerializeConfig,
  SerializationID,
} from '@virtcon2/network-world-entities';
import { defineSerializer } from '@virtcon2/bytenetc';
import { syncServerEntities } from '../enqueue';
import { get_item_by_id, getTileAtPoint } from '@virtcon2/static-game-data';

export default async function requestPlaceHarvestablePacket(packet: ClientPacketWithSender<RequestPlaceHarvestablePacketData>) {
  const player_id = packet.sender.id;

  // Check if player has the item in inventory
  const inventoryItem = await UserInventoryItem.findOne({ where: { user: { id: player_id }, item: { id: packet.data.itemId } } });
  if (!inventoryItem) {
    log(`Player ${player_id} does not have item ${packet.data.itemId}`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  // Get item and check it has harvestable property
  const item = get_item_by_id(packet.data.itemId);
  if (!item || !item.harvestable) {
    log(`Item ${packet.data.itemId} is not a harvestable item`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  // Get world seed from database and validate tile type is GRASS
  const world = await World.findOne({ where: { id: packet.world_id } });
  if (!world) {
    log(`World ${packet.world_id} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  const tileType = getTileAtPoint(world.seed, packet.data.x, packet.data.y);
  if (tileType !== TILE_TYPE.GRASS) {
    log(
      `Player ${player_id} tried to place harvestable on non-grass tile (${tileType}) at ${packet.data.x}, ${packet.data.y}`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // Check if position is occupied by a building
  const occupyingBuilding = await WorldBuilding.findOne({ where: { x: packet.data.x, y: packet.data.y, world: { id: packet.world_id } } });
  if (occupyingBuilding) {
    log(
      `Player ${player_id} tried to place harvestable on occupied position (building) ${packet.data.x}, ${packet.data.y}`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // Check if position is occupied by a resource
  const occupyingResource = await WorldResource.findOne({ where: { x: packet.data.x, y: packet.data.y, world: { id: packet.world_id } } });
  if (occupyingResource) {
    log(
      `Player ${player_id} tried to place harvestable on occupied position (resource) ${packet.data.x}, ${packet.data.y}`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // Check if position is occupied by another harvestable
  const occupyingHarvestable = await WorldHarvestable.findOne({
    where: { x: packet.data.x, y: packet.data.y, worldId: packet.world_id },
  });
  if (occupyingHarvestable) {
    log(
      `Player ${player_id} tried to place harvestable on occupied position (harvestable) ${packet.data.x}, ${packet.data.y}`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // Create the harvestable in database
  const worldHarvestable = WorldHarvestable.create({
    x: packet.data.x,
    y: packet.data.y,
    harvestableName: item.harvestable.name,
    age: 0,
    worldId: packet.world_id,
  });
  await worldHarvestable.save();

  // Remove the item from player inventory
  await AppDataSource.transaction(async (transaction) =>
    UserInventoryItem.addToInventory(transaction, player_id, packet.data.itemId, -1).then(() => publishUserInventoryUpdate(player_id)),
  );

  // Create ECS entity
  const harvestableEntityId = createNewHarvestableEntity(packet.world_id, {
    id: worldHarvestable.id,
    pos: { x: packet.data.x, y: packet.data.y },
    item: item,
    age: 0,
  });

  // Serialize and broadcast to all clients in the world
  const serialize = defineSerializer(getSerializeConfig(packet.world_id)[SerializationID.HARVESTABLE]);
  const serializedHarvestable = serialize(packet.world_id, [harvestableEntityId]);

  return syncServerEntities(packet.world_id, serializedHarvestable, SerializationID.HARVESTABLE);
}
