import { LogApp, LogLevel } from '@shared';
import { AppDataSource, WorldBuilding } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, RequestWorldBuildingChangeOutput } from '@virtcon2/network-packet';
import { log } from 'console';

export default async function requestWorldBuldingChangeOutput(packet: ClientPacketWithSender<RequestWorldBuildingChangeOutput>) {
  const world_building = await WorldBuilding.findOne({ where: { id: packet.data.building_id }, relations: ['building'] });
  if (!world_building) {
    log(
      `Building with id ${packet.data.building_id} not found. Cannot change output of building that is non-existant`,
      LogLevel.ERROR,
      LogApp.PACKET_DATA_SERVER,
    );
    return;
  }

  // change the output
  world_building.output_pos_x = packet.data.output_pos_x;
  world_building.output_pos_y = packet.data.output_pos_y;

  // query and check if there is a building on the position that we set as output
  const occupies = await AppDataSource.query(
    `select wb.id
  from world_building as wb
  inner join building as b
  on b."id" = wb."buildingId"
  where wb."worldId"=$3 and $1 >= wb.x and $1 <= wb.x+b.width - 1 and $2 >= wb.y and $2 <= wb.y+b.height - 1;`,
    [packet.data.output_pos_x, packet.data.output_pos_y, packet.world_id],
  );

  if (occupies.length > 0) {
    const matched_building = await WorldBuilding.findOne({ where: { id: occupies[0].id } });
    world_building.output_world_building = matched_building;
  } else {
    world_building.output_world_building = null;
  }
  if (world_building.building.is_rotatable) {
    world_building.rotation = getRotationFromOutputPosition(world_building);
  }

  await world_building.save();
}

// return radians
function getRotationFromOutputPosition(worldBuilding: WorldBuilding): number {
  const isOutputLeft = worldBuilding.output_pos_x < worldBuilding.x;
  const isOutputRight = worldBuilding.output_pos_x > worldBuilding.x + worldBuilding.building.width - 1;
  const isOutputTop = worldBuilding.output_pos_y < worldBuilding.y;
  const isOutputBottom = worldBuilding.output_pos_y > worldBuilding.y + worldBuilding.building.height - 1;

  if (isOutputLeft) {
    return Math.PI;
  }

  if (isOutputRight) {
    return 0;
  }

  if (isOutputTop) {
    return (3 * Math.PI) / 2;
  }

  if (isOutputBottom) {
    return Math.PI / 2;
  }
}
