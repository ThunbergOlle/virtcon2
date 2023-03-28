import cors from 'cors';

import { JoinPacketData, NetworkPacketData, PacketType } from '@virtcon2/network-packet';
import dotenv from 'dotenv';
import * as express from 'express';
import * as http from 'http';
import { cwd } from 'process';
import { createClient } from 'redis';
import * as socketio from 'socket.io';
import { Redis, RedisPublisher } from './database/Redis';
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
    await new RedisPublisher(redisPubSub).channel(player.world_id).packet_type(PacketType.DISCONNECT).data({ id: player.id }).build().publish();
  });

  socket.on('packet', async (packet: string) => {
    const packetJson = JSON.parse(packet) as NetworkPacketData<unknown>;
    if (packetJson.packet_type === PacketType.JOIN) {
      packetJson.data = { ...(packetJson.data as JoinPacketData), socket_id: socket.id };
      socket.join(packetJson.world_id);
    }

    if (!socket.rooms.has(packetJson.world_id) && packetJson.packet_type !== PacketType.JOIN) {
      log(`Player tried to send packet to world they are not in: ${packetJson.world_id}`, LogLevel.WARN, LogApp.SERVER);
      socket.emit('error', 'You are not in this world!');
      return;
    }


    let packetBuilder = new RedisPublisher(redisPubSub).channel(packetJson.world_id).packet_type(packetJson.packet_type);

    packetBuilder = packetJson.packet_type === PacketType.JOIN ? packetBuilder.target(socket.id) : packetBuilder.target(packetJson.packet_target);

    packetBuilder = packetBuilder.data(packetJson.data);

    await packetBuilder.build().publish();
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

  client.pSubscribe('tick_*', (message, channel) => {
    const packets = message.split(';;').filter((packet) => packet.length);

    if (!packets.length) return;
    log(`Received ${packets.length} packets from ${channel}`, LogLevel.INFO, LogApp.SERVER);

    for(let i = 0; i < packets.length; i++) {
      const [packetTarget, packetData] = packets[i].split('#');

      const packetWithStringData = JSON.parse(packetData) as NetworkPacketData<string>;
      const packetDataJson = JSON.parse(packetWithStringData.data);

      const packet = { ...packetWithStringData, data: packetDataJson } as NetworkPacketData<unknown>;

      const target = packetTarget.split(':')[1];

      if (packetTarget.startsWith('socket:')) {
        io.sockets.to(target).emit('packet', packet);
      } else if (packetTarget.startsWith('world:')) {
        io.sockets.to(target).emit('packet', packet);
      } else {
        log(`Unknown packet target: ${packetTarget}`, LogLevel.WARN, LogApp.SERVER);
      }
    }
  });
})();
