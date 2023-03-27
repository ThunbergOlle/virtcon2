import { exec } from 'child_process';
import { Redis } from '../database/Redis';
import { World } from '../functions/world/world';
import { cwd } from 'process';
import { LogApp, LogLevel, TPS, log } from '@shared';

const createWorld = async (name: string, redis: Redis) => {
  const world = await World.registerWorld(name, redis);
  const worldProcess = exec(`$(which cargo) run`, {
    cwd: `${cwd()}/apps/server_world`,
    env: {
      WORLD_ID: world.id,
      TPS: TPS.toString(),
    },
    shell: process.env.SHELL,
  });
  worldProcess.stdout.on('data', (data) => {
      log(data, LogLevel.INFO, LogApp.WORLD_SERVER);
  });
  worldProcess.stderr.on('data', (data) => {
      log(data, LogLevel.INFO, LogApp.WORLD_SERVER);
  });

  log(`Created world "${name}", --> process id: ${worldProcess.pid}`, LogLevel.OK, LogApp.SERVER);
};

export const worldService = {
  createWorld,
}
