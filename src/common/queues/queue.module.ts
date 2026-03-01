import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// فصلنا إنشاء الاتصال عشان TypeScript ميزعلش
const createRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;

  // لو فيه URL كامل استخدمه
  if (redisUrl) {
    return new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  // لو مفيش، استخدم الـ Object
  return new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
  });
};

export const redisConnection = createRedisConnection();

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CONNECTION',
      useValue: redisConnection,
    },
    {
      provide: 'MAINTENANCE_QUEUE',
      useFactory: () =>
        new Queue('maintenance', { connection: redisConnection }),
    },
    {
      provide: 'STOCK_QUEUE',
      useFactory: () =>
        new Queue('stock', { connection: redisConnection }),
    },
  ],
  exports: ['MAINTENANCE_QUEUE', 'STOCK_QUEUE', 'REDIS_CONNECTION'],
})
export class QueueModule {}