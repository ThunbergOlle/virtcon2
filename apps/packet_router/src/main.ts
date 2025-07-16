import { LogApp, LogLevel, TPS, log, INTERNAL_EVENTS } from '@shared';
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
import { app, io, server } from './app';
import { onExpandPlotEvent } from './internal-events/expandPlot';

dotenv.config({ path: `${cwd()}/.env` });
AppDataSource.initialize().then(() => {
  clearAllInWords();
});

let tick = 0;
const worlds: string[] = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.post('/internal/events', async (req, res) => {
  const { event, world } = req.body;
  if (!worlds.includes(world)) {
    log(`World ${world} not found in entityWorld`, LogLevel.WARN, LogApp.SERVER);
    return res.status(404).send({ error: 'World not found' });
  }

  log(`Received internal event: ${event} for world ${world}`, LogLevel.INFO, LogApp.SERVER);

  switch (event) {
    case INTERNAL_EVENTS.EXPAND_PLOT: {
      await onExpandPlotEvent(world);
      res.sendStatus(204);
    }
  }
});

app.get('/', (_req, res) => {
  res.send({ uptime: process.uptime(), tick });
});

io.on('connection', (socket) => {
  const auth = socket.handshake.headers.authorization;

  socket.on('disconnect', async () => {
    const user = await User.findOne({ where: { token: auth } });
    console.log('User disconnected:', user.display_name);

    const world = user.currentlyInWorld;
    if (!world) return log(`World ${user.currentlyInWorld} not found in entityWorld`, LogLevel.WARN, LogApp.SERVER);

    const wasInWorld = user.currentlyInWorld;

    user.currentlyInWorld = null;
    await user.save();

    const playerQuery = defineQuery(Player);
    const playersEid = playerQuery(world);

    const eid = playersEid.find((eid) => Player(world).userId[eid] === user.id);

    if (eid === undefined) return log(`Player entity not found for user ${user.id}`, LogLevel.WARN, LogApp.SERVER);

    removeEntity(world, eid);
    io.sockets.to(wasInWorld).emit('packets', [
      {
        packet_type: PacketType.DISCONNECT,
        target: wasInWorld,
        sender: SERVER_SENDER,
        data: { eid },
      },
    ]);

    socket.leave(wasInWorld);

    if (playersEid.length - 1 === 0) deleteEntityWorld(world);
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
      socket.emit('error', 'You are not in this world, please refresh!');
      return;
    }

    try {
      await handleClientPacket({
        ...packetJson,
        sender: {
          id: user.id,
          name: user.display_name,
          socket_id: socket.id,
          world_id: packetJson.world_id,
        },
      });
    } catch (error) {
      log(`Error handling packet: ${error}`, LogLevel.ERROR, LogApp.SERVER);
      socket.emit('error', `Error handling packet: ${error}`);
    }
  });
});

app.get('/worlds', async (_req, res) => {
  res.send(worlds);
});

server.listen(4000, () => {
  log('Server started on port 4000', LogLevel.INFO, LogApp.SERVER);
});

const tickInterval = setInterval(() => {
  tick++;
  const startTime = Date.now();
  const packets: Array<ServerPacket<unknown>> = [];

  for (let i = 0; i < worlds.length; i++) {
    const world = worlds[i];
    if (!world) {
      log(`World ${world} not found in entityWorld`, LogLevel.WARN, LogApp.SERVER);
      continue;
    }

    //await checkFinishedBuildings(world, tick);
    const systemsOutput = tickSystems(world);

    for (const { sync, removeEntities } of systemsOutput) {
      if (removeEntities.length)
        packets.push({
          packet_type: PacketType.REMOVE_ENTITY,
          target: world,
          data: {
            packet_type: PacketType.REMOVE_ENTITY,
            entityIds: removeEntities,
          },
          sender: SERVER_SENDER,
        });

      for (const data of sync) {
        if (!data.data.length) continue;
        packets.push({
          packet_type: PacketType.SYNC_SERVER_ENTITY,
          target: world,
          data: {
            serializationId: data.serializationId,
            data: data.data,
          },
          sender: SERVER_SENDER,
        });
      }
    }
  }
  if (!packets.length) return;

  const groupedByTarget = groupBy((packet: ServerPacket<unknown>) => packet.target)(packets);

  for (const target in groupedByTarget) {
    const packets = groupedByTarget[target];
    io.sockets.to(target).emit('packets', packets);
  }

  const endTime = Date.now();
  if (endTime - startTime > 1000 / TPS) {
    log(`Tick for worlds ${worlds} took too long: ${endTime - startTime}ms`, LogLevel.WARN, LogApp.SERVER);
  }
}, 1000 / TPS);

/* Implement SIGKILL logic */
process.on('SIGINT', async () => {
  console.log('Caught interrupt signal');
  clearInterval(tickInterval);

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
