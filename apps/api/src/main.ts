import 'reflect-metadata';
import { LogApp, LogLevel, log } from '@shared';

import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';

/* Initialize database */
AppDataSource.initialize()
  .then(() => {
    log('Database initialized', LogLevel.INFO, LogApp.API);
  })
  .catch((error) => console.log(error));

const host = process.env.HOST ?? 'localhost';
const port = 3002;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.listen(port, host, () => {
  log(`API service started running on http://${host}:${port}`, LogLevel.INFO, LogApp.API);
});
