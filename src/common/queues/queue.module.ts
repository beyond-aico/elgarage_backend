import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ده اللي الملفات التانية محتاجاه عشان الـ Build ينجح
// المرة دي هيشتغل صح لأننا مسحنا ملف الـ .env اللي كان بيجبره يروح لـ 127.0.0.1
export const redisConnection = new IORedis(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // مهم جداً لمكتبة BullMQ
});

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