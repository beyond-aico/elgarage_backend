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

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

function resolveMessage(value: string | string[]): string {
  if (Array.isArray(value)) {
    const first: string | undefined = value[0];
    return first !== undefined ? first : 'Internal server error';
  }
  return value;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string = 'Internal Server Error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const res = response as HttpExceptionResponse;
        const incomingMessage = Array.isArray(res.message)
          ? res.message[0]
          : res.message;
        message = incomingMessage ?? message;
        error = res.error ?? error;
      } else {
        message = String(response);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          message = `Duplicate entry: ${(exception.meta as { target?: string } | undefined)?.target ?? 'unknown'} already exists.`;
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
    } else {
      this.logger.error('Unhandled Exception', exception);
    }

    const rawUrl: unknown = httpAdapter.getRequestUrl(
      ctx.getRequest<Request>(),
    );
    const path: string = typeof rawUrl === 'string' ? rawUrl : '';

    const responseBody: ErrorResponseBody = {
      statusCode: httpStatus,
      message: resolveMessage(message),
      error,
      timestamp: new Date().toISOString(),
      path,
    };

    httpAdapter.reply(ctx.getResponse<Response>(), responseBody, httpStatus);
  }
}
