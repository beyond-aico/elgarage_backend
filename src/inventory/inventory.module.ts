import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { INVENTORY_REPOSITORY } from './interfaces/inventory.repository.interface';
import { InventoryPrismaRepository } from './repositories/inventory.prisma.repository';
import { StockProcessor } from './stock.processor';
import { StockJobs } from './stock.jobs';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    StockJobs,
    StockProcessor,
    {
      provide: INVENTORY_REPOSITORY,
      useClass: InventoryPrismaRepository,
    },
  ],
  exports: [InventoryService, StockJobs],
})
export class InventoryModule {}
