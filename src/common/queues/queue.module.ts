import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// فصلنا إنشاء الاتصال عشان TypeScript ميزعلش
const createRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;

  // لو فيه URL كامل استخدمه (مع الدعم التلقائي للاتصال المشفر rediss://)
  if (redisUrl) {
    return new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    });
  }

  // لو مفيش، استخدم الـ Object مع إضافة دعم الباسورد والسحابة
  return new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined, // Added for Production Redis
    tls: process.env.REDIS_TLS === 'true' ? { rejectUnauthorized: false } : undefined, // Added for Secure Cloud Redis
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