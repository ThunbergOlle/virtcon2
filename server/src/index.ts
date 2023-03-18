import 'module-alias/register';

import { ServerPlayer } from '@shared/types/ServerPlayer';
import cors from 'cors';

import * as express from 'express';
import * as http from 'http';
import 'module-alias/register';
import * as socketio from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from './database/Redis';
import { World } from './functions/world/world';
import { ErrorType } from '@shared/errors/errorTypes';
const redis = new Redis();

redis.connectClient().then(async () => {
  await redis.client.json.set('worlds', '$', {});
  await redis.client.json.set('availableWorlds', '$', []);
  const world = await World.registerWorld('test', redis);
});

const app = express.default();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (_req, res) => {
  res.send({ uptime: process.uptime() });
});

const server = http.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Connected', socket.id);
  socket.on('join', async (worldId: string) => {
    console.log(`Socket ${socket.id} joined world ${worldId}`);
    const world = await World.getWorld(worldId, redis);
    if (!world) {
      console.log(`World ${worldId} not found`);
      socket.emit('error', {message: `World not found`, type: ErrorType.WorldNotFound});
      return;
    }

    const newPlayer = new ServerPlayer('test', worldId, socket.id);
    World.addPlayer(newPlayer, worldId, socket, redis);
    socket.emit('loadWorld', { player: newPlayer, players: world.players, buildings: world.buildings });
    socket.broadcast.to(worldId).emit('newPlayer', newPlayer);
  });
  socket.on('disconnect', async () => {
    const player = await World.getPlayerBySocketId(socket.id, redis);
    if (!player) return;
    World.removePlayer(player, player.worldId, socket, redis);
  });

  socket.on('playerMove', async (data: { x: number; y: number }) => {
    const player = await World.getPlayerBySocketId(socket.id, redis);
    if (!player) return;
    player.pos.x = data.x;
    player.pos.y = data.y;
    World.savePlayer(player, redis);
    console.log(`Player ${player.id} moved to ${player.pos.x}, ${player.pos.y}`);
    socket.broadcast.to(player.worldId).emit('playerMove', player);
  });
});

app.get('/worlds', async (_req, res) => {
  const worlds = await redis.client.json.get('worlds', {
    path: '$.*',
  });
  console.log(worlds);
  res.send(worlds);
});

server.listen(3000, () => {
  console.log('Server running on port: 3000 🚀');
});
