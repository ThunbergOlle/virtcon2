import { LogApp, LogLevel, TPS, log } from '@shared';
import { defineQuery, removeEntity } from '@virtcon2/bytenetc';
import { AppDataSource, User } from '@virtcon2/database-postgres';
import { groupBy } from 'ramda';
import { ClientPacket, PacketType, RequestJoinPacketData, ServerPacket } from '@virtcon2/network-packet';
import { Player } from '@virtcon2/network-world-entities';
import cors from 'cors';
import dotenv from 'dotenv';
import * as express from 'express';
import { cwd } from 'process';
import 'reflect-metadata';
import { IsNull, Not } from 'typeorm';
import { deleteEntityWorld, tickSystems } from './ecs/entityWorld';
import { handleClientPacket } from './packet/packet_handler';
import { SERVER_SENDER } from './packet/utils';
import { redisClient } from './redis';
import { app, io, server } from './app';

dotenv.config({ path: `${cwd()}/.env` });
AppDataSource.initialize().then(() => {
  clearAllInWords();
});

let tick = 0;
const worlds: string[] = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (_req, res) => {
  res.send({ uptime: process.uptime(), tick });
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
    io.sockets.to(wasInWorld).emit('packets', [
      {
        packet_type: PacketType.DISCONNECT,
        target: wasInWorld,
        sender: SERVER_SENDER,
        data: { eid },
      },
    ]);

    if (playersEid.length - 1 === 0) deleteEntityWorld(entityWorld);
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

    return handleClientPacket({
      ...packetJson,
      sender: {
        id: user.id,
        name: user.display_name,
        socket_id: socket.id,
        world_id: packetJson.world_id,
      },
    });
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

const tickInterval = setInterval(() => {
  tick++;
  for (let i = 0; i < worlds.length; i++) {
    const world = worlds[i];
    //await checkFinishedBuildings(world, tick); TODO: ENABLE THIS
    const systemsOutput = tickSystems(world);

    const packets: Array<ServerPacket<unknown>> = [];

    for (const { sync, removeEntities } of systemsOutput) {
      packets.push({
        packet_type: PacketType.REMOVE_ENTITY,
        target: world,
        data: {
          packet_type: PacketType.REMOVE_ENTITY,
          entityIds: removeEntities,
        },
        sender: {
          id: -1,
          name: 'server_syncer',
          socket_id: '',
          world_id: '',
        },
      });

      for (const data of sync) {
        packets.push({
          packet_type: PacketType.SYNC_SERVER_ENTITY,
          target: world,
          data: {
            serializationId: data.serializationId,
            data: data.data,
          },
          sender: {
            id: -1,
            name: 'server_syncer',
            socket_id: '',
            world_id: '',
          },
        });
      }
    }

    if (!world) return log(`World ${world} not found in entityWorld`, LogLevel.WARN, LogApp.SERVER);

    if (!packets.length) continue;

    const groupedByTarget = groupBy((packet: ServerPacket<unknown>) => packet.target)(packets);

    for (const target in groupedByTarget) {
      const packets = groupedByTarget[target];
      io.sockets.to(target).emit('packets', packets);
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
