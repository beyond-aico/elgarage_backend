import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('FATAL: DATABASE_URL is not defined in environment variables');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    // Adapter must be passed into super() — assigning it afterward has no effect
    // because PrismaClient initialises its query engine during construction.
    super({ adapter, log: ['warn', 'error'] });

    // Keep a reference so we can cleanly shut down the pool on module destroy.
    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error);
      // Re-throw so NestJS boot fails loudly rather than serving broken requests.
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
