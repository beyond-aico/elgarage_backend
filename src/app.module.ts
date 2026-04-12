import {
  MiddlewareConsumer,
  Module,
  ModuleMetadata,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
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
import { HealthModule } from './health/health.module';
import { envValidationSchema } from './config/env.validation';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import type { IncomingMessage, ServerResponse } from 'http';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Extracts correlation IDs from res.locals with full type safety.
// customProps receives the raw Node.js IncomingMessage and ServerResponse —
// we cast ServerResponse to access locals which Express attaches at runtime.
function extractCorrelationProps(
  _req: IncomingMessage,
  res: ServerResponse,
): Record<string, string> {
  const locals =
    (res as ServerResponse & { locals?: Record<string, string> }).locals ?? {};

  return {
    correlationId: locals['x-correlation-id'] ?? '',
    requestId: locals['x-request-id'] ?? '',
  };
}

const moduleMetadata: ModuleMetadata = {
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),

    CacheModule.register({
      isGlobal: true,
      ttl: 5 * 60 * 1000,
    }),

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
    HealthModule,

    LoggerModule.forRoot({
      pinoHttp:
        process.env.NODE_ENV === 'production'
          ? {
              level: 'info',
              // customProps is the correct pino-http option for attaching
              // extra fields to every log line from the request context.
              customProps: extractCorrelationProps,
              redact: {
                paths: [
                  'req.headers.authorization',
                  'req.headers.cookie',
                  'req.body.password',
                  'req.body.currentPassword',
                  'req.body.newPassword',
                  'req.body.refreshToken',
                ],
                censor: '[REDACTED]',
              },
            }
          : {
              level: 'debug',
              customProps: extractCorrelationProps,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
