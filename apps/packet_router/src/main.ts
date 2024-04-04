import { LogApp, LogLevel, TPS, log } from '@shared';
import { AppDataSource, User } from '@virtcon2/database-postgres';
import { ClientPacket, PacketType, RequestJoinPacketData, getAllPackets } from '@virtcon2/network-packet';
import cors from 'cors';
import dotenv from 'dotenv';
import * as express from 'express';
import * as http from 'http';
import { cwd } from 'process';
import { RedisClientType, createClient, createClient as createRedisClient } from 'redis';
import 'reflect-metadata';
import * as socketio from 'socket.io';
import { handleClientPacket } from './packet/packet_handler';
import checkFinishedBuildings from './worldBuilding/checkFinishedBuildings';

dotenv.config({ path: `${cwd()}/.env` });
AppDataSource.initialize();

let tick = 0;
const worlds: string[] = [];

const redisClient = createRedisClient() as RedisClientType;

redisClient.on('error', (err) => console.log('Redis Client Error', err));

/* Temporary code, will be moved later. */
redisClient.connect().then(async () => {
  await redisClient.json.set('worlds', '$', {});
});

const redisPubSub = createClient() as RedisClientType;
redisPubSub.on('error', (err) => log(err, LogLevel.ERROR, LogApp.SERVER));
redisPubSub.connect();

const app = express.default();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (_req, res) => {
  res.send({ uptime: process.uptime(), tick });
});

const server = http.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  const auth = socket.handshake.headers.authorization;

  socket.on('disconnect', async () => {
    const user = await User.findOne({ where: { token: auth } });
    console.log('User disconnected:', user.display_name);
    // enqueuePacket(redisClient, player.world_id, {
    //   packet_type: PacketType.DISCONNECT,
    //   target: player.world_id,
    //   sender: {
    //     id: 1,
    //     name: 'tmp',
    //     socket_id: socket.id,
    //     world_id: player.world_id,
    //   },
    //   data: { id: player.id },
    // });
  });

  socket.on('packet', async (packet: string) => {
    const packetJson = JSON.parse(packet) as ClientPacket<unknown>;
    packetJson.world_id = packetJson.world_id.replace(/\s/g, '_'); // replace all spaces in world_id with underscores

    const user = await User.findOne({ where: { token: auth } });

    if (packetJson.packet_type === PacketType.REQUEST_JOIN) {
      packetJson.data = { ...(packetJson.data as RequestJoinPacketData), socket_id: socket.id };
      socket.join(packetJson.world_id);
      if (!worlds.includes(packetJson.world_id)) worlds.push(packetJson.world_id);
    }

    if (!socket.rooms.has(packetJson.world_id) && packetJson.packet_type !== PacketType.REQUEST_JOIN) {
      log(`Player tried to send packet to world they are not in: ${packetJson.world_id}`, LogLevel.WARN, LogApp.SERVER);
      socket.emit('error', 'You are not in this world!');
      return;
    }

    return handleClientPacket(
      {
        ...packetJson,
        sender: {
          id: user.id,
          name: user.display_name,
          socket_id: socket.id,
          world_id: packetJson.world_id,
        },
      },
      redisClient,
    );
  });
});

app.get('/worlds', async (_req, res) => {
  const worlds = await redisClient.json.get('worlds', {
    path: '$.*',
  });

  res.send(worlds);
});

server.listen(4000, () => {
  log('Server started on port 4000', LogLevel.INFO, LogApp.SERVER);
});

const tickInterval = setInterval(async () => {
  tick++;
  for (const world of worlds) {
    checkFinishedBuildings(world, tick, redisClient);
    const packets = await getAllPackets(redisClient, world);
    if (!packets.length) continue;

    log(`Sending ${packets.length} packets to world ${world}`, LogLevel.INFO, LogApp.SERVER);
    for (const packet of packets) {
      io.sockets.to(packet.target).emit('packet', {
        data: packet.data,
        packet_type: packet.packet_type,
      });
    }
  }
}, 1000 / TPS);

/* Implement SIGKILL logic */
process.on('SIGINT', async () => {
  clearInterval(tickInterval);
  await redisClient.disconnect();
  process.exit();
});
