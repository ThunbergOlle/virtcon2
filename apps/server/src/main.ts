import cors from 'cors';

import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import { Redis } from './database/Redis';
import { World } from './functions/world/world';
import { setupPlayerEventHandler } from './events/player/playerEventHandler';

const redis = new Redis();

redis.connectClient().then(async () => {
  await redis.client.json.set('worlds', '$', {});
  await redis.client.json.set('availableWorlds', '$', []);
  await World.registerWorld('test', redis);
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
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  setupPlayerEventHandler(socket, redis);
  socket.on('disconnect', async () => {
    const player = await World.getPlayerBySocketId(socket.id, redis);
    if (!player) return;
    World.removePlayer(player, player.worldId, socket, redis);
    socket.broadcast.to(player.worldId).emit('playerDisconnect', player);
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
