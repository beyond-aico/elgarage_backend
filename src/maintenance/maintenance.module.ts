import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CarsModule } from '../cars/cars.module';
import { MAINTENANCE_REPOSITORY } from './interfaces/maintenance.repository.interface';
import { MaintenancePrismaRepository } from './repositories/maintenance.prisma.repository';

@Module({
  imports: [PrismaModule, CarsModule],
  controllers: [MaintenanceController],
  providers: [
    MaintenanceService,
    {
      provide: MAINTENANCE_REPOSITORY,
      useClass: MaintenancePrismaRepository,
    },
  ],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
