import type { Request } from 'express';
import type { JwtFromRequestFunction } from 'passport-jwt';

/**
 * Strict, ESLint-safe JWT extractors.
 * No passport-jwt helpers are used.
 */

export const jwtFromAuthorizationHeader =
  (): JwtFromRequestFunction =>
  (req: Request): string | null => {
    if (!req?.headers?.authorization) {
      return null;
    }

    const [type, token] = req.headers.authorization.split(' ');

    return type === 'Bearer' && token ? token : null;
  };

export const jwtFromBody =
  (field: string): JwtFromRequestFunction =>
  (req: Request): string | null => {
    if (!req.body) {
      return null;
    }

    // Cast req.body (which is any) to a Record to safely access fields
    const body = req.body as Record<string, unknown>;
    const value = body[field];

    return typeof value === 'string' ? value : null;
  };
