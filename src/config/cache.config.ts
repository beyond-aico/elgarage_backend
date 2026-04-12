/**
 * Shared cache TTL constants (milliseconds).
 *
 * These are intentionally conservative — data that changes rarely (brands,
 * models, services) gets a longer TTL; data that changes more frequently
 * (inventory) gets a shorter one.
 *
 * All values can be overridden via environment variables so production
 * tuning never requires a code change.
 */
export const CACHE_TTL = {
  /** Car brands and models — change only when admin adds new ones */
  BRANDS: Number(process.env.CACHE_TTL_BRANDS_MS) || 5 * 60 * 1000, // 5 min

  /** Service catalogue — changes only when admin edits services */
  SERVICES: Number(process.env.CACHE_TTL_SERVICES_MS) || 5 * 60 * 1000, // 5 min
} as const;
