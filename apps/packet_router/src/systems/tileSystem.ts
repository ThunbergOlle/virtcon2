import { renderDistance } from '@shared';
import { defineQuery, defineSerializer, defineSystem, removeEntity, World } from '@virtcon2/bytenetc';
import * as DB from '@virtcon2/database-postgres';
import { syncRemoveEntities, syncServerEntities } from '@virtcon2/network-packet';
import { createTile, fromPhaserPos, Player, Position, SerializationID, serializeConfig, Tile } from '@virtcon2/network-world-entities';
import { redisClient } from '../redis';

const tileQuery = defineQuery(Tile, Position);
const playerQuery = defineQuery(Player, Position);

export const createTileSystem = (world: World, seed: number) =>
  defineSystem(() => {
    const tileEntities = tileQuery(world);
    const playerEntities = playerQuery(world);
    if (!playerEntities.length) return;
    if (!tileEntities.length) return;

    const removedEntities = [];
    const newEntities = [];

    for (let i = 0; i < playerEntities.length; i++) {
      const playerEid = playerEntities[i];
      const { x, y } = fromPhaserPos({ x: Position.x[playerEid], y: Position.y[playerEid] });

      const [minX, maxX] = [x - renderDistance, x + renderDistance];
      const [minY, maxY] = [y - renderDistance, y + renderDistance];

      for (let j = 0; j < tileEntities.length; j++) {
        const tileEid = tileEntities[j];
        const { x: tileX, y: tileY } = fromPhaserPos({ x: Position.x[tileEid], y: Position.y[tileEid] });

        if (tileX >= minX && tileX <= maxX && tileY >= minY && tileY <= maxY) {
          continue;
        }

        if (tileX < minX || tileX > maxX || tileY < minY || tileY > maxY) {
          removeEntity(world, tileEid);
          removedEntities.push(tileEid);
        }
      }

      for (let j = minX; j <= maxX; j++) {
        for (let k = minY; k <= maxY; k++) {
          if (
            tileEntities.some((eid) => {
              const { x: tileX, y: tileY } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
              return tileX === j && tileY === k;
            })
          )
            continue;

          const height = DB.World.getHeightAtPoint(seed, j, k);
          const tileEntityId = createTile(j, k, height, world);
          newEntities.push(tileEntityId);
        }
      }
    }

    syncRemoveEntities(redisClient, world, world, removedEntities).then(() => {
      const serializedTiles = defineSerializer(serializeConfig[SerializationID.TILE])(world, newEntities);
      syncServerEntities(redisClient, world, world, serializedTiles, SerializationID.TILE);
    });
  });
