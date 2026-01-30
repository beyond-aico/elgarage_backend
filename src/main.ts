import { NestFactory, HttpAdapterHost } from '@nestjs/core'; // Import HttpAdapterHost
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino'; // Assuming you kept pino, otherwise use generic Logger
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  // If you are using standard NestJS logger, use: const logger = new Logger('Bootstrap');
  const logger = app.get(Logger);

  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Filter & Interceptor
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useLogger(logger);

  const config = new DocumentBuilder()
    .setTitle('Car Service API')
    .setDescription('Enterprise Backend for Car Service Management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}/api/v1`);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
