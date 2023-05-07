import { LogApp, LogLevel, RedisWorld, TPS, log } from '@shared';
import { exec } from 'child_process';
import { cwd } from 'process';
import { RedisClientType } from 'redis';
import { World } from './world_utils';

const startWorldProcess = async (new_world: RedisWorld, redis: RedisClientType) => {
  const world = await World.registerWorld(new_world, redis);
  const worldProcess = exec(`$(which cargo) run`, {
    cwd: `${cwd()}/apps/packet_tick_server`,
    env: {
      WORLD_ID: world.id,
      TPS: TPS.toString(),
    },
    shell: process.env['SHELL'],
  });
  worldProcess.stdout?.on('data', (data) => {
    log(data, LogLevel.INFO, LogApp.PACKET_TICK_SERVER);
  });
  worldProcess.stderr?.on('data', (data) => {
    log(data, LogLevel.INFO, LogApp.PACKET_TICK_SERVER);
  });

  log(`Created world "${new_world.id}", --> process id: ${worldProcess.pid}`, LogLevel.OK, LogApp.SERVER);
};

export const worldService = {
  startWorldProcess,
};
