import { ErrorType, ServerPlayer } from "@shared";
import { Socket } from "socket.io";
import { Redis } from "../../database/Redis";
import { World } from "../../functions/world/world";

export async function playerJoinEvent(worldId: string, socket: Socket, redis: Redis) {
  console.log(`Socket ${socket.id} joined world ${worldId}`);
  const world = await World.getWorld(worldId, redis);
  if (!world) {
    console.log(`World ${worldId} not found`);
    socket.emit('error', { message: `World not found`, type: ErrorType.WorldNotFound });
    return;
  }

  const newPlayer = new ServerPlayer('test', worldId, socket.id);
  World.addPlayer(newPlayer, worldId, socket, redis);
  socket.emit('loadWorld', { player: newPlayer, players: world.players, buildings: world.buildings });
  socket.broadcast.to(worldId).emit('newPlayer', newPlayer);
}
