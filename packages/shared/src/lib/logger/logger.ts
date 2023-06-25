import * as chalk from 'chalk';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  OK = 'OK',
  DEBUG = 'DEBUG',
}
export enum LogApp {
  DEFAULT = 'DEFAULT',
  GAME = 'GAME',
  SERVER = 'SERVER',
  PACKET_TICK_SERVER = 'PACKET_TICK_SERVER',
  PACKET_DATA_SERVER = 'PACKET_DATA_SERVER',
  DATABASE_POSTGRES = 'DATABASE_POSTGRES',
  SHARED = 'SHARED',
  API = 'API',
  NETWORK = 'NETWORK',
}
function getAppPrefix(app: LogApp) {
  // color codes
  const colors = {
    [LogApp.DEFAULT]: chalk.blue,
    [LogApp.GAME]: chalk.green,
    [LogApp.SERVER]: chalk.yellow,
    [LogApp.PACKET_TICK_SERVER]: chalk.magenta,
    [LogApp.API]: chalk.green,
    [LogApp.SHARED]: chalk.cyan,
    [LogApp.NETWORK]: chalk.red,
    [LogApp.PACKET_DATA_SERVER]: chalk.magenta,
    [LogApp.DATABASE_POSTGRES]: chalk.magenta,
  };

  return colors[app](app);
}
export function getLogLevelPrefix(level: LogLevel) {
  // color codes
  const colors = {
    [LogLevel.INFO]: chalk.bgBlue,
    [LogLevel.WARN]: chalk.bgYellow,
    [LogLevel.ERROR]: chalk.bgRed,
    [LogLevel.OK]: chalk.bgGreen,
    [LogLevel.DEBUG]: chalk.bgCyan,
  };

  return colors[level](`[${chalk.black(level)}]`);
}
export const log = (message: string, level: LogLevel = LogLevel.INFO, app: LogApp = LogApp.DEFAULT) => {
  console.log(`[${chalk.cyan(new Date().toLocaleTimeString())}] ${getLogLevelPrefix(level)} [${getAppPrefix(app)}] → ${message}`);
};
