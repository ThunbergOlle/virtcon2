import { ApolloServer } from '@apollo/server';
import { LogApp, LogLevel, log } from '@shared';
import http from 'http';
import 'reflect-metadata';

import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { AppDataSource, setupDatabase } from '@virtcon2/database-postgres';
import cors from 'cors';
import express from 'express';
import { useServer } from 'graphql-ws/lib/use/ws';
import { buildSchema } from 'type-graphql';
import { WebSocketServer } from 'ws';
import { FormatGraphQLErrorResponse } from './graphql/FormatGraphQLErrorResponse';
import { ContextMiddleware, RequestContext } from './graphql/RequestContext';
import { resolvers } from './resolvers/resolvers';

log('Starting API', LogLevel.INFO, LogApp.API);

const host = process.env.HOST ?? 'localhost';
const port = 3000;

(async () => {
  /* Initialize database */
  await AppDataSource.initialize();
  await setupDatabase();
  log('Database initialized', LogLevel.INFO, LogApp.API);

  const app = express();

  app.use(
    cors({
      methods: '*',
      // origin: ['http://localhost:4200', 'http://localhost:3000', 'https://sandbox.embed.apollographql.com', 'https://studio.apollographql.com/'],
      origin: '*',
      allowedHeaders: '*',
      credentials: true,
    }),
  );

  const httpServer = http.createServer(app);

  const schema = await buildSchema({
    resolvers: resolvers,
    validate: {
      forbidUnknownValues: false,
    },
  });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({ schema }, wsServer);

  const apolloServer = new ApolloServer<RequestContext>({
    schema: schema,
    csrfPrevention: false,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: FormatGraphQLErrorResponse,
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(apolloServer, {
      context: ContextMiddleware,
    }),
  );

  app.get('/', (req, res) => {
    res.send({ message: 'Hello API' });
  });

  httpServer.listen(port, host, () => {
    log(`API service started running on http://${host}:${port}`, LogLevel.INFO, LogApp.API);
  });
})();
