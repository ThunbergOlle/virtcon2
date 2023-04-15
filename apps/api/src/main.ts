import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { LogApp, LogLevel, log } from '@shared';
import http from 'http';

import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from 'cors';
import express from 'express';
import { buildSchema } from 'type-graphql';
import { AppDataSource } from './data-source';
import { FormatGraphQLErrorResponse } from './graphql/FormatGraphQLErrorResponse';
import { ContextMiddleware, RequestContext } from './graphql/RequestContext';
import { setupDatabase } from './import/setup-database';
import { resolvers } from './resolvers/resolvers';

const host = process.env.HOST ?? 'localhost';
const port = 3000;

(async () => {
  /* Initialize database */
  await AppDataSource.initialize();
  await setupDatabase();
  log('Database initialized', LogLevel.INFO, LogApp.API);

  const app = express();
  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer<RequestContext>({
    schema: await buildSchema({
      resolvers: resolvers,
      validate: {
        forbidUnknownValues: false,
      },
    }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: FormatGraphQLErrorResponse,
  });
  await apolloServer.start();

  app.use(cors());
  app.use(express.json());
  app.use(
    expressMiddleware(apolloServer, {
      context: ContextMiddleware,
    }),
  );
  app.get('/', (req, res) => {
    res.send({ message: 'Hello API' });
  });

  app.listen(port, host, () => {
    log(`API service started running on http://${host}:${port}`, LogLevel.INFO, LogApp.API);
  });
})();