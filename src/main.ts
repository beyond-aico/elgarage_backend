import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  app.use(helmet());

  // --- CORS FIX ---
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  let allowedOrigins: string | string[] = 'http://localhost:3000'; // Safe fallback

  if (corsOrigin) {
    allowedOrigins = corsOrigin.includes(',')
      ? corsOrigin.split(',').map((o) => o.trim())
      : corsOrigin;
  }

  app.enableCors({
    origin: allowedOrigins,
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

  // قراءة البورت مباشرة من البيئة لضمان التوافق مع ريل واي
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is listening on port: ${port}`);
  logger.log(`Application is running on: http://0.0.0.0:${port}/api/v1`);
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
