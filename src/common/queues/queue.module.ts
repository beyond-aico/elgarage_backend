import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const createRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    // rediss:// scheme means TLS is required — certificate verification is
    // always enforced. Never pass rejectUnauthorized: false in any environment;
    // doing so silently strips the security guarantee of TLS entirely.
    return new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  const tlsEnabled = process.env.REDIS_TLS === 'true';

  return new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    // tls: {} with no overrides means Node.js enforces full certificate chain
    // validation using the system CA store. Do NOT add rejectUnauthorized: false
    // — it defeats TLS entirely and exposes credentials to MITM attacks.
    tls: tlsEnabled ? {} : undefined,
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
      useFactory: () => new Queue('stock', { connection: redisConnection }),
    },
  ],
  exports: ['MAINTENANCE_QUEUE', 'STOCK_QUEUE', 'REDIS_CONNECTION'],
})
export class QueueModule {}
