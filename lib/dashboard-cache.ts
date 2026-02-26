/**
 * Shared server-side caches for dashboard and scripts.
 * Call invalidateUser(userId) after creating/updating scripts so the next request gets fresh data.
 */

const CACHE_DURATION_MS = 30_000;

export const dashboardCache = new Map<string, { data: object; cacheTime: number }>();
export const scriptsCache = new Map<string, { data: { scripts: unknown[] }; cacheTime: number }>();

export function invalidateUser(userId: string): void {
  dashboardCache.delete(userId);
  scriptsCache.delete(userId);
}

export { CACHE_DURATION_MS };
