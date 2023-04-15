import * as chalk from 'chalk';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  OK = 'OK',
}
export enum LogApp {
  DEFAULT = 'DEFAULT',
  GAME = 'GAME',
  SERVER = 'SERVER',
  WORLD_SERVER = 'WORLD_SERVER',
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
    [LogApp.WORLD_SERVER]: chalk.magenta,
    [LogApp.API]: chalk.green,
    [LogApp.SHARED]: chalk.cyan,
    [LogApp.NETWORK]: chalk.red,
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
  };

  return colors[level](`[${chalk.black(level)}]`);
}
export const log = (message: string, level: LogLevel = LogLevel.INFO, app: LogApp = LogApp.DEFAULT) => {
  console.log(`[${chalk.cyan(new Date().toLocaleTimeString())}] ${getLogLevelPrefix(level)} [${getAppPrefix(app)}] → ${message}`);

};
