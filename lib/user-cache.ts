/**
 * In-memory cache for GET /api/user to reduce duplicate hits.
 * Onboarding (and other updaters) can invalidate so the next request gets fresh data.
 */
export const USER_CACHE_MS = 15_000;
const userCache = new Map<string, { data: object; cacheTime: number }>();

export function getUserCache() {
  return userCache;
}

export function invalidateUserCache(userId: string) {
  userCache.delete(userId);
}

export function setUserCache(userId: string, data: object) {
  userCache.set(userId, { data, cacheTime: Date.now() });
}

export function getUserCached(userId: string): object | null {
  const entry = userCache.get(userId);
  if (!entry || Date.now() - entry.cacheTime >= USER_CACHE_MS) return null;
  return entry.data;
}
