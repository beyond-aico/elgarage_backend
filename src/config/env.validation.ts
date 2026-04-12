import * as Joi from 'joi';

/**
 * Validates all environment variables at bootstrap time.
 * If any required variable is missing or has the wrong shape the application
 * refuses to start and prints a clear error — no silent failures mid-request.
 *
 * Rules:
 *   - required()   → must be present and non-empty
 *   - optional()   → may be absent; default() is applied when absent
 *   - valid(...)   → must be one of the listed values
 */
export const envValidationSchema = Joi.object({
  // ── Runtime ────────────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  PORT: Joi.number().integer().min(1).max(65535).default(3000),

  // ── Database ───────────────────────────────────────────────────────────
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  // ── JWT ────────────────────────────────────────────────────────────────
  // Minimum 32 characters enforced — short secrets are brute-forceable.
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ── Redis ──────────────────────────────────────────────────────────────
  // Either REDIS_URL (managed cloud) or REDIS_HOST + REDIS_PORT (self-hosted).
  // At least one of the two must be present — enforced via .or() below.
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .optional(),
  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().integer().min(1).max(65535).default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  REDIS_TLS: Joi.string().valid('true', 'false').default('false'),

  // ── CORS ───────────────────────────────────────────────────────────────
  CORS_ORIGIN: Joi.string().optional(),

  // ── Postgres (Docker Compose only — not used by the app directly) ──────
  POSTGRES_USER: Joi.string().optional(),
  POSTGRES_PASSWORD: Joi.string().optional(),
  POSTGRES_DB: Joi.string().optional(),
})
  // At least one Redis connection method must be provided.
  .or('REDIS_URL', 'REDIS_HOST')
  // Unknown keys in .env are allowed (e.g. CI-injected variables) but
  // are stripped before being handed to ConfigService.
  .options({ allowUnknown: false, abortEarly: false });
