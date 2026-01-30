import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { INVENTORY_REPOSITORY } from './interfaces/inventory.repository.interface';
import { InventoryPrismaRepository } from './repositories/inventory.prisma.repository';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: INVENTORY_REPOSITORY,
      useClass: InventoryPrismaRepository,
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
