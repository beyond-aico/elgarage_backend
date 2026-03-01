import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // 1. Handle NestJS HttpExceptions
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const res = response as { message?: string | string[]; error?: string };

        const incomingMessage = Array.isArray(res.message)
          ? res.message[0]
          : res.message;

        message = incomingMessage || message;
        error = res.error || error;
      } else {
        // التعديل هنا: تحويل الاستجابة لنص صريح لحل خطأ TS2322
        message = String(response);
      }
    }
    // 2. Handle Prisma Errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          message = `Duplicate entry: ${(exception.meta as { target?: string })?.target} already exists.`;
          error = 'Conflict';
          break;
        case 'P2025':
          httpStatus = HttpStatus.NOT_FOUND;
          message = 'Record not found.';
          error = 'Not Found';
          break;
        case 'P2003':
          httpStatus = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference: Related record does not exist.';
          error = 'Bad Request';
          break;
        default:
          this.logger.error(
            `Unhandled Prisma Error: ${exception.code}`,
            exception,
          );
          break;
      }
    }
    else {
      this.logger.error('Unhandled Exception', exception);
    }

    const responseBody = {
      statusCode: httpStatus,
      // تأكيد أخير إن الرسالة نص
      message: Array.isArray(message) ? message[0] : message,
      error,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}