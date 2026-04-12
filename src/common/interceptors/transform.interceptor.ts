import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  timestamp: string;
  data: T;
  meta?: unknown;
}

interface PaginatedPayload {
  data: unknown;
  meta?: unknown;
}

function isPaginatedPayload(value: unknown): value is PaginatedPayload {
  return value !== null && typeof value === 'object' && 'data' in value;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T): ApiResponse<T> => {
        const statusCode: number = response.statusCode;

        if (isPaginatedPayload(data)) {
          return {
            statusCode,
            timestamp: new Date().toISOString(),
            data: data.data as T,
            meta: data.meta,
          };
        }

        return {
          statusCode,
          timestamp: new Date().toISOString(),
          data,
          meta: undefined,
        };
      }),
    );
  }
}
