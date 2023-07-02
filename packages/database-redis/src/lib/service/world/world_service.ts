import { LogApp, LogLevel, RedisWorld, RedisWorldBuilding, RedisWorldResource, TPS, asRedisItem, log } from '@shared';
import { exec } from 'child_process';
import { cwd } from 'process';
import { RedisClientType } from 'redis';
import { World as WorldUtils } from './world_utils';
import { World as PostgresWorldEntity, WorldBuilding } from '@virtcon2/database-postgres';

const startWorldProcess = async (new_world: RedisWorld, redis: RedisClientType): Promise<number> => {
  const world = await WorldUtils.registerWorld(new_world, redis);
  if (!world) {
    log(`Failed to register world "${new_world.id}"`, LogLevel.ERROR, LogApp.SERVER);
    return 0;
  }

  const worldProcess = exec(`$(which cargo) run`, {
    cwd: `${cwd()}/apps/packet_tick_server`,
    env: {
      RUST_BACKTRACE: '1',
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
  // save the world process id to redis
  if (!worldProcess.pid) {
    log(`Failed to start world "${new_world.id}"`, LogLevel.ERROR, LogApp.SERVER);
    return 0;
  }
  // get world processes key
  const world_processes = await redis.json.get('world_processes');
  if (!world_processes) {
    await redis.json.set('world_processes', '$', []);
  }
  redis.json.arrAppend(`world_processes`, '$', worldProcess.pid);
  return worldProcess.pid;
};
const getWorldProcesses = async (redis: RedisClientType): Promise<Array<number>> => {
  const world_processes = await redis.json.get('world_processes');
  if (!world_processes) {
    return [];
  }
  return world_processes as unknown as Array<number>;
};
const loadWorld = async (world_id: string): Promise<RedisWorld> => {
  const world = await PostgresWorldEntity.findOne({ where: { id: world_id }, relations: ['resources', 'resources.item'] });
  if (!world) {
    throw new Error(`World ${world_id} does not exist.`);
  }
  /* Uncomment this when debugging procedural world generation */
  // await PostgresWorldEntity.RegenerateWorld(world.id)
  const buildings = await WorldBuilding.find({ where: { world: { id: world.id } }, relations: ['building', 'building.items_to_be_placed_on', 'building.item'] });
  return {
    id: world.id,
    players: [],
    buildings: buildings as unknown as Array<RedisWorldBuilding>,
    resources: world.resources as unknown as Array<RedisWorldResource>,
    height_map: PostgresWorldEntity.Get2DWorldMap(world.seed),
  } as RedisWorld;
};
const killWorldProcess = async (pid: number, redis: RedisClientType): Promise<void> => {
  // send SIGTERM to the world process
  try {
    log(`Killing process ${pid}`, LogLevel.INFO, LogApp.SERVER);
    process.kill(pid, 'SIGTERM');
  } catch (e) {
    log(String(e), LogLevel.ERROR, LogApp.SERVER);
    log(`Failed to kill process ${pid}`, LogLevel.ERROR, LogApp.SERVER);
  }

  // remove the world process from redis
  const world_processes = (await redis.json.get('world_processes')) as Array<number>;
  if (!world_processes) {
    return;
  }
  const new_world_processes = world_processes.filter((world_process: number) => world_process !== pid);
  await redis.json.set('world_processes', '$', new_world_processes);
};

const clearWorlds = async (redis: RedisClientType): Promise<void> => {
  const world_processes = (await redis.json.get('world_processes')) as Array<number>;
  if (world_processes && world_processes.length > 0) {
    for (let i = 0; i < world_processes.length; i++) {
      await killWorldProcess(world_processes[i], redis);
    }
  }
  await redis.json.set('worlds', '$', {});
};

export const worldService = {
  startWorldProcess,
  loadWorld,
  getWorldProcesses,
  killWorldProcess,
  clearWorlds,
};
