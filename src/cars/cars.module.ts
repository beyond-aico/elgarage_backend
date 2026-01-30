import { Module } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CarsPrismaRepository } from './repositories/cars.prisma.repository';
import { CARS_REPOSITORY } from './interfaces/cars.repository.interface';

@Module({
  imports: [PrismaModule],
  controllers: [CarsController],
  providers: [
    CarsService,
    {
      provide: CARS_REPOSITORY,
      useClass: CarsPrismaRepository,
    },
  ],
  exports: [CarsService],
})
export class CarsModule {}
