import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Attaches two IDs to every request:
 *
 * x-correlation-id — either forwarded from the caller (e.g. an upstream
 *   service or API gateway) or generated fresh. This is the ID to use when
 *   tracing a logical operation that spans multiple services.
 *
 * x-request-id — always generated fresh for this specific HTTP request.
 *   Useful for correlating the exact request/response pair in logs even
 *   when the caller does not send a correlation ID.
 *
 * Both IDs are:
 *   - Attached to res.locals so downstream middleware can read them.
 *   - Written back to the response headers so the caller can log them.
 *   - Picked up automatically by the pino-http logger via reqCustomProps.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string | undefined) ??
      randomUUID();

    const requestId = randomUUID();

    // Make IDs available to downstream handlers via res.locals.
    res.locals[CORRELATION_ID_HEADER] = correlationId;
    res.locals[REQUEST_ID_HEADER] = requestId;

    // Echo both IDs back in the response so API consumers can log them.
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
