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
import { FleetModule } from './fleet/fleet.module';
import { NotificationsModule } from './notifications/notifications.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

const moduleMetadata: ModuleMetadata = {
  imports: [
    // ConfigModule first — other modules may read env vars at bootstrap
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // NotificationsModule before any module whose providers use NotificationsService
    NotificationsModule,
    PrismaModule,
    QueueModule,
    AuthModule,
    UsersModule,
    CarsModule,
    MaintenanceModule,
    InventoryModule,
    ServicesModule,
    OrdersModule,
    ScheduleModule.forRoot(),
    AdminModule,
    FleetModule,

    LoggerModule.forRoot({
      pinoHttp:
        process.env.NODE_ENV === 'production'
          ? { level: 'info' }
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
  controllers: [AppController],
  providers: [AppService],
};

@Module(moduleMetadata)
export class AppModule {}
