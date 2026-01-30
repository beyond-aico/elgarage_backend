import { Module, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CarsModule } from './cars/cars.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { PrismaModule } from './prisma/prisma.module';
import { InventoryModule } from './inventory/inventory.module';
import { ServicesModule } from './services/services.module';
import { OrdersModule } from './orders/orders.module';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from './common/queues/queue.module';
import { AdminModule } from './admin/admin.module';

const moduleMetadata: ModuleMetadata = {
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CarsModule,
    MaintenanceModule,
    InventoryModule,
    ServicesModule,
    OrdersModule,
    ScheduleModule.forRoot(),
    QueueModule,
    AdminModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    LoggerModule.forRoot({
      pinoHttp:
        process.env.NODE_ENV === 'production'
          ? {
              level: 'info',
            }
          : {
              level: 'debug',
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  singleLine: true,
                },
              },
            },
    }),
  ],
};

@Module(moduleMetadata)
export class AppModule {}
