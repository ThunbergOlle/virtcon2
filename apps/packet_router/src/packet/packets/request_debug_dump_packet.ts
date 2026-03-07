import { serializeAllEntities } from '@virtcon2/bytenetc';
import { LogApp, LogLevel, log } from '@shared';
import { ClientPacketWithSender } from '@virtcon2/network-packet';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';

export const requestDebugDumpPacket = (packet: ClientPacketWithSender<{ clientDump?: unknown[] }>) => {
  const serverDump = serializeAllEntities(packet.world_id);
  log(`[ECS DUMP - SERVER] world=${packet.world_id} entities=${serverDump.length}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);

  const tmpDir = join(cwd(), 'tmp');
  mkdirSync(tmpDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `ecs-dump-${packet.world_id}-${timestamp}`;

  const serverPath = join(tmpDir, `${base}-server.json`);
  writeFileSync(serverPath, JSON.stringify(serverDump, null, 2));
  log(`[ECS DUMP - SERVER] written to ${serverPath}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);

  if (packet.data?.clientDump) {
    const clientPath = join(tmpDir, `${base}-client.json`);
    writeFileSync(clientPath, JSON.stringify(packet.data.clientDump, null, 2));
    log(`[ECS DUMP - CLIENT] written to ${clientPath}`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
  }
};
