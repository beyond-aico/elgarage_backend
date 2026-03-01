import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      // ده البروفايدر اللي هيعمل الاتصال بالرديس "فقط" لما الأبلكيشن يحتاجه
      provide: 'REDIS_CONNECTION',
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        
        // لو فيه رابط كامل (REDIS_URL) استخدمه، لو مفيش استخدم الـ Host والـ Port
        if (redisUrl) {
          return new IORedis(redisUrl, {
            maxRetriesPerRequest: null, // مهم جداً لمكتبة BullMQ
          });
        }
        
        return new IORedis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT) || 6379,
          maxRetriesPerRequest: null,
        });
      },
    },
    {
      provide: 'MAINTENANCE_QUEUE',
      useFactory: (connection: IORedis) =>
        new Queue('maintenance', { connection }),
      inject: ['REDIS_CONNECTION'], // بنحقن الاتصال هنا بعد ما يتجهز
    },
    {
      provide: 'STOCK_QUEUE',
      useFactory: (connection: IORedis) =>
        new Queue('stock', { connection }),
      inject: ['REDIS_CONNECTION'],
    },
  ],
  exports: ['MAINTENANCE_QUEUE', 'STOCK_QUEUE', 'REDIS_CONNECTION'],
})
export class QueueModule {}