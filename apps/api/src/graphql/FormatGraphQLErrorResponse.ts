import { LogLevel, LogApp } from '@shared';
import { RequestLog } from '@virtcon2/database-postgres';
import { log } from 'console';
import { GraphQLFormattedError } from 'graphql';

export function FormatGraphQLErrorResponse(error: GraphQLFormattedError): GraphQLFormattedError {
  RequestLog.create({
    ip: String('Internal server'),
    requestName: String(error.extensions.code),
    message: String(error.message),
    time: 0,
    timestamp: new Date(),
    stack_trace: String(error.extensions.stacktrace),
    url: String(error.path),
  }).save();

  log(error, LogLevel.ERROR, LogApp.API);
  return error;
}
