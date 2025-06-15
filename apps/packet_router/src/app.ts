import * as http from 'http';
import * as socketio from 'socket.io';
import * as express from 'express';

export const app = express.default();
export const server = http.createServer(app);
export const io = new socketio.Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
  },
});
