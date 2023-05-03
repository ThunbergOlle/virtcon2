import { DataSource } from 'typeorm';
import entities from './entity/entities';
export const enableSQLLogging = true;
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '',
  database: 'virtcon',
  synchronize: true,
  logging: enableSQLLogging,
  entities: entities,
  subscribers: [],
  migrations: [],
});
