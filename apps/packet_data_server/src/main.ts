import dotenv from 'dotenv';
import { cwd } from 'process';

import {createClient as createRedisClient} from 'redis';

dotenv.config({ path: `${cwd()}/.env` });

const redisClient = createRedisClient();

redisClient.on('error', (err) => console.log('Redis Client Error', err));



