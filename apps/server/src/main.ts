import cors from 'cors';

import { JoinPacketData, NetworkPacketData, PacketType } from '@virtcon2/network-packet';
import dotenv from 'dotenv';
import * as express from 'express';
import * as http from 'http';
import { cwd } from 'process';
import { createClient } from 'redis';
import * as socketio from 'socket.io';
import { Redis } from './database/Redis';
import { World } from './functions/world/world';
import { worldService } from './services/world_service';
import { LogApp, LogLevel, log } from '@shared';

dotenv.config({ path: `${cwd()}/.env` });

const redis = new Redis();

/* Temporary code, will be moved later. */
redis.connectClient().then(async () => {
  await redis.client.json.set('worlds', '$', {});
  worldService.createWorld('Test World', redis);
});

const redisPubSub = createClient();
redisPubSub.on('error', (err) => log(err, LogLevel.ERROR, LogApp.SERVER));
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

io.on('connection', (socket) => {
  socket.on('disconnect', async () => {
    const player = await World.getPlayerBySocketId(socket.id, redis);
    if (!player) return;
    await redisPubSub.publish(player.world_id, PacketType.DISCONNECT + '#' + JSON.stringify({ id: player.id }));
  });

  socket.on('packet', async (packet: string) => {
    const packetJson = JSON.parse(packet) as NetworkPacketData<unknown>;
    if (!socket.rooms.has(packetJson.world_id)) {
      if (packetJson.packet_type === PacketType.JOIN) {
        packetJson.data = { ...packetJson.data as JoinPacketData, socket_id: socket.id };
        await redisPubSub.publish(packetJson.world_id, packetJson.packet_type + '#' + JSON.stringify(packetJson.data));
        return;
      }
      log(`Player tried to send packet to world they are not in: ${packetJson.world_id}`, LogLevel.WARN, LogApp.SERVER);
      socket.emit('error', 'You are not in this world!');
      return;
    }
    log(`Sending packet: ${packetJson.packet_type} ${JSON.stringify(packetJson.data)}`, LogLevel.INFO, LogApp.SERVER);
    await redisPubSub.publish(packetJson.world_id, packetJson.packet_type + '#' + JSON.stringify(packetJson.data));
  });
});

app.get('/worlds', async (_req, res) => {
  const worlds = await redis.client.json.get('worlds', {
    path: '$.*',
  });

  res.send(worlds);
});

server.listen(3000, () => {
  log('Server started on port 3000', LogLevel.INFO, LogApp.SERVER);
});

/* Implement SIGKILL logic */
process.on('SIGINT', async () => {
  await redis.client.disconnect();

  process.exit();
});

/* Subscribe to packet messages from the world */
(async () => {
  const client = createClient();
  await client.connect();
  client.pSubscribe('from_world:*', (message, channel) => {
    // get world id from channel
    const worldId = channel.split(':')[1];
    const packet = JSON.parse(message) as NetworkPacketData<unknown>;
    log(`Packet received from WORLD_SERVER: ${packet.packet_type} on channel: ${channel}`, LogLevel.INFO, LogApp.SERVER);
    io.to(worldId).emit('packet', message);
  });
})();
