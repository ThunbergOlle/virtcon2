import { log, LogApp, LogLevel, renderDistance, TILE_LEVEL, TILE_TYPE } from '@shared';
import { User, World } from '@virtcon2/database-postgres';
import {
  ClientPacketWithSender,
  enqueuePacket,
  LoadWorldPacketData,
  PacketType,
  RequestJoinPacketData,
  syncServerEntities,
  SyncServerEntityPacket,
} from '@virtcon2/network-packet';

import {
  Coordinates,
  createNewPlayerEntity,
  createTile,
  fromPhaserPos,
  Player,
  playerEntityComponents,
  Position,
  SerializationID,
  serializeConfig,
  Sprite,
  Tile,
} from '@virtcon2/network-world-entities';

import { defineQuery, defineSerializer, serializeAllEntities, SerializedData } from '@virtcon2/bytenetc';
import { RedisClientType } from 'redis';
import { doesWorldExist, initializeWorld } from '../../ecs/entityWorld';
import { SERVER_SENDER } from '../utils';

const playerQuery = defineQuery(...playerEntityComponents);

export default async function requestJoinPacket(packet: ClientPacketWithSender<RequestJoinPacketData>, client: RedisClientType) {
  await ensureWorldIsRunning(packet.world_id);

  const serializeWorld = serializeAllEntities(packet.world_id);

  const user = await User.findOne({ where: { token: packet.data.token } });
  if (!user) return log(`User with token ${packet.data.token} does not exist.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
  user.currentlyInWorld = packet.world_id;
  await user.save();

  await enqueuePacket<LoadWorldPacketData>(client, packet.world_id, {
    packet_type: PacketType.LOAD_WORLD,
    target: packet.sender.socket_id,
    data: {
      id: packet.world_id,
      mainPlayerId: user.id,
    },
    sender: SERVER_SENDER,
  });

  await enqueuePacket<SyncServerEntityPacket>(client, packet.world_id, {
    packet_type: PacketType.SYNC_SERVER_ENTITY,
    target: packet.data.socket_id,
    data: {
      serializationId: SerializationID.WORLD,
      data: serializeWorld,
    },
    sender: SERVER_SENDER,
  });

  const allPlayerEid = playerQuery(packet.world_id);
  const existingPlayer = allPlayerEid.find((eid) => Player.userId[eid] === user.id);
  if (existingPlayer !== undefined) throw new Error(`Player entity already exists for user ${user.id}`);

  const startingPosition: [number, number] = [0, 0];
  const joinedPlayerEntity = createNewPlayerEntity(packet.world_id, {
    userId: user.id,
    name: user.display_name,
    position: startingPosition,
  });

  const seed = await World.findOne({ where: { id: packet.world_id } }).then((w) => w.seed);
  const serializedTiles = loadTilesAroundEntity(seed, packet.world_id, joinedPlayerEntity);
  await syncServerEntities(client, packet.world_id, packet.world_id, serializedTiles, SerializationID.TILE);

  const serialize = defineSerializer(serializeConfig[SerializationID.PLAYER_FULL_SERVER]);
  const serializedPlayer = serialize(packet.world_id, [joinedPlayerEntity]);
  syncServerEntities(client, packet.world_id, packet.world_id, serializedPlayer, SerializationID.PLAYER_FULL_SERVER);

  return;
}

export const loadTilesAroundEntity = (seed: number, worldId: string, eid: number): SerializedData[] => {
  const phaserX = Position.x[eid];
  const phaserY = Position.y[eid];

  const { x, y } = fromPhaserPos({ x: phaserX, y: phaserY });

  const [minX, maxX] = [x - renderDistance, x + renderDistance];
  const [minY, maxY] = [y - renderDistance, y + renderDistance];

  const tileEids = [];

  const loadedTiles = defineQuery(Tile)(worldId);

  for (let i = minX; i <= maxX; i++) {
    for (let j = minY; j <= maxY; j++) {
      if (
        loadedTiles.some((eid) => {
          const { x: tileX, y: tileY } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
          return tileX === i && tileY === j;
        })
      )
        continue;

      const height = World.getHeightAtPoint(seed, i, j);
      const tileEntityId = createTile(i, j, height, worldId);
      tileEids.push(tileEntityId);
    }
  }

  const findTile = ({ x, y }: Coordinates) =>
    tileEids.find((eid) => {
      const { x: tileX, y: tileY } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
      return tileX === x && tileY === y;
    });

  const decoder = new TextDecoder();

  // update variants to depending on neighbors
  for (const middleTile of tileEids) {
    const middleTileType = decoder.decode(Tile.type[middleTile]);
    const { x, y } = fromPhaserPos({ x: Position.x[middleTile], y: Position.y[middleTile] });

    const [leftTile, rightTile, topTile, bottomTile] = [
      findTile({ x: x - 1, y: y }),
      findTile({ x: x + 1, y: y }),
      findTile({ x: x, y: y - 1 }),
      findTile({ x: x, y: y + 1 }),
    ];

    const [leftTileType, rightTileType, topTileType, bottomTileType] = [
      decoder.decode(Tile.type[leftTile]),
      decoder.decode(Tile.type[rightTile]),
      decoder.decode(Tile.type[topTile]),
      decoder.decode(Tile.type[bottomTile]),
    ];

    //    console.log(`x${topTile.slice(0, 1)}x
    //${leftTile.slice(0, 1)}${middleTileType.slice(0, 1)}${rightTile.slice(0, 1)}
    //x${bottomTile.slice(0, 1)}x
    //`)

    switch (middleTileType) {
      case TILE_TYPE.WATER: {
        if (rightTileType === TILE_TYPE.SAND) {
          const rightShoreTile = createTile(x + 1, y, TILE_LEVEL[TILE_TYPE.WATER], worldId);
          Sprite.variant[rightShoreTile] = 5;
          break;
        }
        if (leftTileType === TILE_TYPE.SAND) {
          const leftShoreTile = createTile(x - 1, y, TILE_LEVEL[TILE_TYPE.WATER], worldId);
          Sprite.variant[leftShoreTile] = 4;
          break;
        }
        if (topTileType === TILE_TYPE.SAND) {
          const topShoreTile = createTile(x, y - 1, TILE_LEVEL[TILE_TYPE.WATER], worldId);
          Sprite.variant[topShoreTile] = 6;
          break;
        } else break;
      }
    }
  }

  const tiles = defineQuery(Tile)(worldId);
  const serialize = defineSerializer(serializeConfig[SerializationID.TILE]);
  return serialize(worldId, tiles);
};

const ensureWorldIsRunning = async (worldId: string) => {
  /* Check if world is currently running in Redis */
  let dbWorld = await World.findOne({ where: { id: worldId } });
  if (!dbWorld) dbWorld = await World.GenerateNewWorld(worldId);

  if (!doesWorldExist(worldId)) {
    log(`World ${worldId} is not running. Starting up world...`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
    try {
      await initializeWorld(worldId);
    } catch (e) {
      log(e, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
      return log(`Failed to start world ${worldId}.`, LogLevel.ERROR, LogApp.PACKET_DATA_SERVER);
    }
  } else log(`World ${worldId} is already running.`, LogLevel.INFO, LogApp.PACKET_DATA_SERVER);
};
