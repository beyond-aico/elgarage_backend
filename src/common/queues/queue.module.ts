import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});

@Global()
@Module({
  providers: [
    {
      provide: 'MAINTENANCE_QUEUE',
      useFactory: () =>
        new Queue('maintenance', {
          connection: redisConnection,
        }),
    },
    {
      provide: 'STOCK_QUEUE',
      useFactory: () =>
        new Queue('stock', {
          connection: redisConnection,
        }),
    },
  ],
  exports: ['MAINTENANCE_QUEUE', 'STOCK_QUEUE'],
})
export class QueueModule {}
