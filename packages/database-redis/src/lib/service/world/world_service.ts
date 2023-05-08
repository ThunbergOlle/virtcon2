import { LogApp, LogLevel, RedisWorld, RedisWorldResource, TPS, asRedisItem, log } from '@shared';
import { exec } from 'child_process';
import { cwd } from 'process';
import { RedisClientType } from 'redis';
import { World as WorldUtils } from './world_utils';
import { World as PostgresWorldEntity} from '@virtcon2/database-postgres';

const startWorldProcess = async (new_world: RedisWorld, redis: RedisClientType): Promise<number> => {
  const world = await WorldUtils.registerWorld(new_world, redis);
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
  return worldProcess.pid || 0;
};
const loadWorld = async (world_id: string): Promise<RedisWorld> => {
  const world = await PostgresWorldEntity.findOne({ where: { id: world_id }, relations: ['resources', 'resources.item'] });
  if (!world) {
    throw new Error(`World ${world_id} does not exist.`);
  }
  await PostgresWorldEntity.RegenerateWorld(world.id)

  return {
    id: world.id,
    players: [],
    buildings: [],
    resources: asRedisItem<RedisWorldResource[]>(world.resources),
    height_map: PostgresWorldEntity.Get2DWorldMap(world.seed),
  } as RedisWorld;
};

export const worldService = {
  startWorldProcess,
  loadWorld,
};
