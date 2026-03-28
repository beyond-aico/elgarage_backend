import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceCron } from './maintenance.cron';
import { MaintenanceJobs } from './maintenance.jobs';
import { MaintenanceProcessor } from './maintenance.processor';
import { MaintenanceRepository } from './repositories/maintenance.prisma.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CarsModule } from '../cars/cars.module';

@Module({
  imports: [PrismaModule, CarsModule],
  controllers: [MaintenanceController],
  providers: [
    MaintenanceService,
    MaintenanceRepository,
    MaintenanceCron,
    MaintenanceJobs,
    MaintenanceProcessor,
  ],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
