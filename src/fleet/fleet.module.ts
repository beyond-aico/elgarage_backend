import { Module } from '@nestjs/common';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FLEET_REPOSITORY } from './interfaces/fleet.repository.interface';
import { FleetPrismaRepository } from './repositories/fleet.prisma.repository';

@Module({
  imports: [PrismaModule],
  controllers: [FleetController],
  providers: [
    FleetService,
    {
      provide: FLEET_REPOSITORY,
      useClass: FleetPrismaRepository,
    },
  ],
  exports: [FleetService, FLEET_REPOSITORY],
})
export class FleetModule {}
