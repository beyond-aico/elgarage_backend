import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CarsModule } from '../cars/cars.module';
import { MaintenanceRepository } from './repositories/maintenance.prisma.repository';

@Module({
  imports: [PrismaModule, CarsModule],
  controllers: [MaintenanceController],
  providers: [
    MaintenanceService,
    MaintenanceRepository, // <--- FIX: Provide the class directly
  ],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}