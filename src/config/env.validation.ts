import * as Joi from 'joi';

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
  // min(32) removed — Railway secrets may be shorter than 32 characters
  // depending on how they were generated in the Railway dashboard.
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ── Redis ──────────────────────────────────────────────────────────────
  // Either REDIS_URL (managed cloud) or REDIS_HOST + REDIS_PORT (self-hosted).
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .optional(),
  REDIS_HOST: Joi.string().optional().allow(''),
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
  // At least one Redis connection method must be present.
  .or('REDIS_URL', 'REDIS_HOST')
  // allowUnknown: true — Railway injects its own variables into every
  // container at runtime (RAILWAY_*, npm_*, PATH, HOME, HOSTNAME, etc.).
  // Blocking unknown keys breaks every cloud deployment. We validate only
  // the keys we own and silently ignore everything else.
  .options({ allowUnknown: true, abortEarly: false });
