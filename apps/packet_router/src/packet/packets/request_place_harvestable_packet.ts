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
  Building,
  createNewHarvestableEntity,
  fromPhaserPos,
  getSerializeConfig,
  Harvestable,
  Position,
  Resource,
  SerializationID,
} from '@virtcon2/network-world-entities';
import { defineQuery, defineSerializer } from '@virtcon2/bytenetc';
import { syncServerEntities } from '../enqueue';
import { get_item_by_id, getTileAtPoint, getHarvestableByItem } from '@virtcon2/static-game-data';

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

  const buildingQuery = defineQuery(Building, Position);
  const buildingEntities = buildingQuery(world.id);
  for (let i = 0; i < buildingEntities.length; i++) {
    const buildingEid = buildingEntities[i];
    const { x: buildingX, y: buildingY } = fromPhaserPos({ x: Position(world.id).x[buildingEid], y: Position(world.id).y[buildingEid] });
    if (buildingX === packet.data.x && buildingY === packet.data.y) {
      log(
        `Player ${player_id} tried to place harvestable on occupied position (building entity) ${packet.data.x}, ${packet.data.y}`,
        LogLevel.ERROR,
        LogApp.PACKET_DATA_SERVER,
      );
      return;
    }
  }

  const resourceQuery = defineQuery(Resource, Position);
  const resourceEntities = resourceQuery(world.id);
  for (let i = 0; i < resourceEntities.length; i++) {
    const resourceEid = resourceEntities[i];
    const { x: resourceX, y: resourceY } = fromPhaserPos({ x: Position(world.id).x[resourceEid], y: Position(world.id).y[resourceEid] });
    if (resourceX === packet.data.x && resourceY === packet.data.y) {
      log(
        `Player ${player_id} tried to place harvestable on occupied position (resource entity) ${packet.data.x}, ${packet.data.y}`,
        LogLevel.ERROR,
        LogApp.PACKET_DATA_SERVER,
      );
      return;
    }
  }

  const harvestableQuery = defineQuery(Harvestable, Position);
  const harvestableEntities = harvestableQuery(world.id);
  for (let i = 0; i < harvestableEntities.length; i++) {
    const harvestableEid = harvestableEntities[i];
    const { x: harvestableX, y: harvestableY } = fromPhaserPos({
      x: Position(world.id).x[harvestableEid],
      y: Position(world.id).y[harvestableEid],
    });
    if (harvestableX === packet.data.x && harvestableY === packet.data.y) {
      log(
        `Player ${player_id} tried to place harvestable on occupied position (harvestable entity) ${packet.data.x}, ${packet.data.y}`,
        LogLevel.ERROR,
        LogApp.PACKET_DATA_SERVER,
      );
      return;
    }
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
    harvestable: getHarvestableByItem(item.name),
    age: 0,
  });

  // Serialize and broadcast to all clients in the world
  const serialize = defineSerializer(getSerializeConfig(packet.world_id)[SerializationID.HARVESTABLE]);
  const serializedHarvestable = serialize(packet.world_id, [harvestableEntityId]);

  return syncServerEntities(packet.world_id, serializedHarvestable, SerializationID.HARVESTABLE);
}
