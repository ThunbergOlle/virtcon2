import cors from 'cors';

import { TPS } from '@shared';
import { NetworkPacketData, extractWorldId } from '@virtcon2/network-packet';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import * as express from 'express';
import * as http from 'http';
import { cwd } from 'process';
import { createClient } from 'redis';
import * as socketio from 'socket.io';
import { Redis } from './database/Redis';
import { setupPlayerEventHandler } from './events/player/playerEventHandler';
import { World } from './functions/world/world';

dotenv.config({ path: `${cwd()}/.env` });

const redis = new Redis();

redis.connectClient().then(async () => {
  await redis.client.json.set('worlds', '$', {});
  const world = await World.registerWorld('test', redis);
  const worldProcess = exec(`$(which cargo) run`, {
    cwd: `${cwd()}/apps/server_world`,
    env: {
      WORLD_ID: world.id,
      TPS: TPS.toString(),
    },
    shell: process.env.SHELL,
  });
  worldProcess.stdout.on('data', (data) => {
    console.log('Data:' + data);
  });
  worldProcess.stderr.on('data', (data) => {
    console.log('Error: ', data);
  });

  console.log(worldProcess.pid);
});

const redisPubSub = createClient();
redisPubSub.on('error', (err) => console.log('Redis pub sub client error', err));
redisPubSub.connect();

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
(async () => {
  const client = createClient();
  await client.connect();
  client.pSubscribe('from_world:*', (message, channel) => {
    // get world id from channel
    const worldId = channel.split(':')[1];
    console.log(`🖥 Packet received: ${message} on channel: ${channel}`);
    io.to(worldId).emit('packet', message);
  });
})();

io.on('connection', (socket) => {
  socket.on('disconnect', async () => {
    const player = await World.getPlayerBySocketId(socket.id, redis);
    if (!player) return;
    World.removePlayer(player, player.world_id, socket, redis);
    socket.broadcast.to(player.world_id).emit('playerDisconnect', player);
  });

  socket.on('packet', async (packet: string) => {
    const packetJson = JSON.parse(packet) as NetworkPacketData<unknown>;
    if (!socket.rooms.has(packetJson.world_id)) {
      socket.join(packetJson.world_id);
    }
    console.log(`🖥 Sending Packet: ${packet} on channel: ${packetJson.world_id}`);
    await redisPubSub.publish(packetJson.world_id, packetJson.packet_type + '#' + JSON.stringify(packetJson.data));
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

/* Implement SIGKILL logic */
process.on('SIGINT', async () => {
  await redis.client.disconnect();

  process.exit();
});
