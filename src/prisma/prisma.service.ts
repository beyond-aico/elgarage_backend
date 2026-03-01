import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // إحنا مش هننادي على super هنا بالـ adapter مباشرة
    // هنخلي الـ adapter يتجهز جوه الـ constructor لضمان قراءة الـ env
    super({
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    // ربط الـ adapter بالـ client قبل الاتصال
    (this as any).adapter = adapter; 

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}