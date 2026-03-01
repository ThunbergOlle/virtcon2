import { log, LogApp, LogLevel } from '@shared';
import { AssemblerWorldBuilding, publishWorldBuildingUpdate, WorldBuilding } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestSetAssemblerOutputPacketData } from '@virtcon2/network-packet';
import { Assembler, Building } from '@virtcon2/network-world-entities';
import { all_db_items_recipes, DBItemName, get_item_by_id } from '@virtcon2/static-game-data';
import { defineQuery } from '@virtcon2/bytenetc';

export default async function requestSetAssemblerOutputPacket(packet: ClientPacketWithSender<RequestSetAssemblerOutputPacketData>) {
  const { worldBuildingId, outputItemId } = packet.data;
  const worldId = packet.world_id;

  // 1. Validate the world building exists and is an assembler
  const worldBuilding = await WorldBuilding.findOne({
    where: { id: worldBuildingId },
    relations: ['building'],
  });

  if (!worldBuilding) {
    log(`WorldBuilding ${worldBuildingId} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  if (worldBuilding.building.name !== DBItemName.BUILDING_ASSEMBLER) {
    log(`WorldBuilding ${worldBuildingId} is not an assembler`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    return;
  }

  // 2. Validate outputItemId if provided
  let requiredTicks = 0;
  if (outputItemId != null) {
    const item = get_item_by_id(outputItemId);
    if (!item) {
      log(`Item ${outputItemId} not found`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return;
    }
    if (!item.craftingTime) {
      log(`Item ${outputItemId} is not craftable (no craftingTime)`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return;
    }
    const hasRecipe = all_db_items_recipes.some((r) => r.resultingItem.id === outputItemId);
    if (!hasRecipe) {
      log(`Item ${outputItemId} has no recipe`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return;
    }
    requiredTicks = Math.ceil(item.craftingTime / 50);
  }

  // 3. Find or create AssemblerWorldBuilding record, update outputItemId and reset progress
  let assemblerRecord = await AssemblerWorldBuilding.findOne({ where: { worldBuildingId } });
  if (!assemblerRecord) {
    assemblerRecord = AssemblerWorldBuilding.create({ worldBuildingId, outputItemId: null, progressTicks: 0 });
  }
  assemblerRecord.outputItemId = outputItemId;
  assemblerRecord.progressTicks = 0;
  await assemblerRecord.save();

  // 4. Update ECS Assembler component
  const buildingQuery = defineQuery(Building, Assembler);
  const entities = buildingQuery(worldId);
  for (const eid of entities) {
    if (Building(worldId).worldBuildingId[eid] === worldBuildingId) {
      Assembler(worldId).outputItemId[eid] = outputItemId ?? 0;
      Assembler(worldId).progressTicks[eid] = 0;
      Assembler(worldId).requiredTicks[eid] = requiredTicks;
      break;
    }
  }

  // 5. Publish update so UI subscribriptions refresh
  await publishWorldBuildingUpdate(worldBuildingId);
}
