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

    // 1. Handle NestJS HttpExceptions (e.g. NotFoundException, BadRequestException)
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();

      // Extract message from object or string
      if (typeof response === 'object' && response !== null) {
        const res = response as { message?: string | string[]; error?: string };

        // FIX: Handle both array and string safely, falling back to default if undefined
        const incomingMessage = Array.isArray(res.message)
          ? res.message[0]
          : res.message;

        message = incomingMessage || message;
        error = res.error || error;
      } else {
        message = response;
      }
    }
    // 2. Handle Prisma Errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': // Unique constraint failed
          httpStatus = HttpStatus.CONFLICT;
          message = `Duplicate entry: ${(exception.meta as { target?: string })?.target} already exists.`;
          error = 'Conflict';
          break;
        case 'P2025': // Record not found
          httpStatus = HttpStatus.NOT_FOUND;
          message = 'Record not found.';
          error = 'Not Found';
          break;
        case 'P2003': // Foreign key constraint failed
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
    // 3. Log unknown errors
    else {
      this.logger.error('Unhandled Exception', exception);
    }

    const responseBody = {
      statusCode: httpStatus,
      message: Array.isArray(message) ? message[0] : message,
      error,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
