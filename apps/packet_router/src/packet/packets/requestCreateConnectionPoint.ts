import { log, LogLevel } from '@shared';
import { WorldBuilding } from '@virtcon2/database-postgres';
import { ClientPacketWithSender, CreateConnectionPointPacket } from '@virtcon2/network-packet';

export const requestCreateConnectionPoint = async (packet: ClientPacketWithSender<CreateConnectionPointPacket>) => {
  const [startX, startY, endX, endY] = [packet.data.startX, packet.data.startY, packet.data.endX, packet.data.endY];

  const startBuilding = await WorldBuilding.findOne({
    where: { x: startX, y: startY, worldId: packet.sender.world_id },
  });

  const endBuilding = await WorldBuilding.findOne({
    where: { x: endX, y: endY, worldId: packet.sender.world_id },
  });

  if (!startBuilding || !endBuilding) {
    log(`Could not find start or end building for connection point`, LogLevel.ERROR);
    return;
  }

  startBuilding.outputWorldBuildingId = endBuilding.id;
  startBuilding.save();

  // TODO: FIGURE OUT WHAT TO DO WITH CONNECTION POINT? KEEP IT SIMPLE?
  //await WorldConnectionPoint.create({
  //
  //  startX,
  //  startY,
  //  endX,
  //  endY,
  //  worldId: packet.sender.world_id,
  //}).save();
};
