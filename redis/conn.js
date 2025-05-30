import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,                       
  password: process.env.REDIS_PASSWORD,  
  maxRetriesPerRequest: null,
});

export default connection;

