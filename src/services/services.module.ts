import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SERVICES_REPOSITORY } from './interfaces/services.repository.interface';
import { ServicesPrismaRepository } from './repositories/services.prisma.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    {
      provide: SERVICES_REPOSITORY,
      useClass: ServicesPrismaRepository,
    },
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
