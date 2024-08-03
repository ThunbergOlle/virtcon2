import { LogApp, LogLevel, TPS, log } from '@shared';
import { AppDataSource, User } from '@virtcon2/database-postgres';
import { ClientPacket, DisconnectPacketData, PacketType, RequestJoinPacketData, enqueuePacket, getAllPackets } from '@virtcon2/network-packet';
import { Player } from '@virtcon2/network-world-entities';
import cors from 'cors';
import dotenv from 'dotenv';
import * as express from 'express';
import * as http from 'http';
import { cwd } from 'process';
import { RedisClientType, createClient, createClient as createRedisClient } from 'redis';
import 'reflect-metadata';
import * as socketio from 'socket.io';
import { IsNull, Not } from 'typeorm';
import { handleClientPacket } from './packet/packet_handler';
import { SERVER_SENDER } from './packet/utils';
import checkFinishedBuildings from './worldBuilding/checkFinishedBuildings';
import { defineQuery, removeEntity } from '@virtcon2/bytenetc';

dotenv.config({ path: `${cwd()}/.env` });
AppDataSource.initialize().then(() => {
  clearAllInWords();
});

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

    const entityWorld = user.currentlyInWorld;
    if (!entityWorld) return log(`World ${user.currentlyInWorld} not found in entityWorld`, LogLevel.WARN, LogApp.SERVER);

    const wasInWorld = user.currentlyInWorld;

    user.currentlyInWorld = null;
    await user.save();

    const playerQuery = defineQuery(Player);
    const playersEid = playerQuery(entityWorld);

    const eid = playersEid.find((eid) => Player.userId[eid] === user.id);

    if (eid === undefined) return log(`Player entity not found for user ${user.id}`, LogLevel.WARN, LogApp.SERVER);

    removeEntity(entityWorld, eid);

    enqueuePacket<DisconnectPacketData>(redisClient, wasInWorld, {
      packet_type: PacketType.DISCONNECT,
      target: wasInWorld,
      sender: SERVER_SENDER,
      data: { eid },
    });
  });

  socket.on('packet', async (packetJson: ClientPacket<unknown>) => {
    packetJson.world_id = packetJson.world_id.replace(/\s/g, '_'); // replace all spaces in world_id with underscores

    const user = await User.findOne({ where: { token: auth } });

    if (!user) return;
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
    if (!world) return log(`World ${world} not found in entityWorld`, LogLevel.WARN, LogApp.SERVER);

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
  console.log('Caught interrupt signal');
  clearInterval(tickInterval);
  await redisClient.disconnect();

  for (const world of worlds) {
    const users = await User.find({ where: { currentlyInWorld: world } });
    for (const user of users) {
      user.currentlyInWorld = null;
      await user.save();
    }
  }

  process.exit();
});

async function clearAllInWords() {
  log('Clearing all users from worlds', LogLevel.INFO, LogApp.SERVER);
  const users = await User.find({
    where: { currentlyInWorld: Not(IsNull()) },
  });

  for (const user of users) {
    user.currentlyInWorld = null;
    await user.save();
  }
}
