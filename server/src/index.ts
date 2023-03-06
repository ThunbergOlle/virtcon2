import 'module-alias/register';
import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import { World } from "./gameClasses/World";
import cors from "cors";
import { ServerPlayer } from "@shared/types/ServerPlayer";


const lobbies: World[] = [];
const testWorld = new World("test");
lobbies.push(testWorld);

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
  socket.on("join", (lobbyId: string) => {
    const player = new ServerPlayer("test");
    lobbies.find(lobby => lobby.id === lobbyId)?.addPlayer(player);
    socket.emit("newMainPlayer", player);
  })
  socket.emit("availableLobbies", lobbies);
  
});

server.listen(3000, () => {
  console.log("Running at localhost:3000");
});
