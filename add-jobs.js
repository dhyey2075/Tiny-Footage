import { Queue } from 'bullmq';
import connection from './redis/conn.js';

const myQueue = new Queue('foo', { connection });

async function addJobs() {
  await myQueue.add('myJobName', { foo: 'bar' });
  await myQueue.add('myJobName2', { qux: 'baz' });
}

addJobs();
