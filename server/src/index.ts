import 'module-alias/register';
import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import { World } from "./gameClasses/World";
import cors from "cors";
import { ServerPlayer } from "@shared/types/ServerPlayer";


const worlds: World[] = [];
const testWorld = new World("test");
worlds.push(testWorld);

const app = express.default();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())

app.get("/", (_req, res) => {
  res.send({ uptime: process.uptime() });
});

const server = http.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Connected", socket.id);
  socket.on("join", (worldId: string) => {
    console.log(`Socket ${socket.id} joined world ${worldId}`)
    const world = worlds.find(world => world.id === worldId);
    if (!world) {
      console.log(`World ${worldId} not found`);
      socket.emit("error", `World not found`);
      return;
    }

    const player = new ServerPlayer("test", socket);
    world.addPlayer(player);
    socket.emit("loadWorld", {player: player, buildings: world.buildings });
    socket.broadcast.emit("newPlayer", player);
  })
  socket.on("disconnect", () => {
    
  })
});

app.get("/worlds", (_req, res) => {
  const availableWorlds = worlds.map(lobby => ({
    id: lobby.id,
    name: lobby.name,
    playerCount: lobby.players.length
  }))
  res.send(availableWorlds);
});

server.listen(3000, () => {
  console.log("Server running on port: 3000 🚀");
});
