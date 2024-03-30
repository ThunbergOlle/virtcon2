import 'reflect-metadata';
import cors from 'cors';
import { LogApp, LogLevel, TPS, log } from '@shared';
import { AppDataSource } from '@virtcon2/database-postgres';
import { ClientPacket, PacketType, RequestJoinPacketData, enqueuePacket, getAllPackets } from '@virtcon2/network-packet';
import dotenv from 'dotenv';
import * as express from 'express';
import * as http from 'http';
import { cwd } from 'process';
import { RedisClientType, createClient, createClient as createRedisClient } from 'redis';
import * as socketio from 'socket.io';
import { handleClientPacket } from './packet/packet_handler';
import Redis from '@virtcon2/database-redis';
import { all_db_buildings, get_building_by_id } from '@virtcon2/static-game-data';
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
  socket.on('disconnect', async () => {
    const player = await Redis.getPlayerBySocketId(socket.id, redisClient);
    if (!player) return;
    enqueuePacket(redisClient, player.world_id, {
      packet_type: PacketType.DISCONNECT,
      target: player.world_id,
      sender: player,
      data: { id: player.id },
    });
    Redis.removePlayer(player, player.world_id, socket, redisClient);
  });

  socket.on('packet', async (packet: string) => {
    const packetJson = JSON.parse(packet) as ClientPacket<unknown>;
    packetJson.world_id = packetJson.world_id.replace(/\s/g, '_'); // replace all spaces in world_id with underscores

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

    const sender = await Redis.getPlayerBySocketId(socket.id, redisClient);

    return handleClientPacket({ ...packetJson, sender }, redisClient);
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
