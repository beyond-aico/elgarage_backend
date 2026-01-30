import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CarsModule } from '../cars/cars.module';
import { ORDERS_REPOSITORY } from './interfaces/orders.repository.interface';
import { OrdersPrismaRepository } from './repositories/orders.prisma.repository';

@Module({
  imports: [PrismaModule, CarsModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: ORDERS_REPOSITORY,
      useClass: OrdersPrismaRepository,
    },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
