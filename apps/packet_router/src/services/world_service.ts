import { LogApp, LogLevel, TPS, log } from '@shared';
import { exec } from 'child_process';
import { cwd } from 'process';
import { RedisClientType } from 'redis';
import { World } from '../functions/world/world';

const createWorld = async (name: string, redis: RedisClientType) => {
  const world = await World.registerWorld(name, redis);
  const worldProcess = exec(`$(which cargo) run`, {
    cwd: `${cwd()}/apps/packet_tick_server`,
    env: {
      WORLD_ID: world.id,
      TPS: TPS.toString(),
    },
    shell: process.env.SHELL,
  });
  worldProcess.stdout.on('data', (data) => {
    log(data, LogLevel.INFO, LogApp.PACKET_TICK_SERVER);
  });
  worldProcess.stderr.on('data', (data) => {
    log(data, LogLevel.INFO, LogApp.PACKET_TICK_SERVER);
  });

  log(`Created world "${name}", --> process id: ${worldProcess.pid}`, LogLevel.OK, LogApp.SERVER);
};

export const worldService = {
  createWorld,
};
