import { NetworkServerPlayerMoveEvent, playerPositionUpdateRate } from '@shared';
import { Socket } from 'socket.io';
import { Redis } from '../../database/Redis';
import { World } from '../../functions/world/world';
/**
export async function playerMoveEvent(data: NetworkServerPlayerMoveEvent, socket: Socket, redis: Redis, forceUpdate = false) {
  const player = await World.getPlayerBySocketId(socket.id, redis);
  if (!player) return;
  if (Date.now() - player.pos.updated < playerPositionUpdateRate && !forceUpdate) return;
  player.pos.x = data.x;
  player.pos.y = data.y;
  player.pos.updated = Date.now();
  World.savePlayer(player, redis);
  console.log(`Player ${player.id} moved to ${player.pos.x}, ${player.pos.y}`);

  // If force update = true, then we want to force to update new position on the clients. Therefor we need to call "playerSetPosition"
  forceUpdate ? socket.broadcast.to(player.world_id).emit('playerSetPosition', player) : socket.broadcast.to(player.world_id).emit('playerMove', player);
}
*/
