/**
 * Simple performance measurement for logging slow operations.
 * Usage:
 *   const perf = measurePerformance('Fetch avatars');
 *   await fetchAvatars();
 *   perf.end();
 */
export function measurePerformance(label: string): { end: () => number } {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  return {
    end: () => {
      const duration =
        typeof performance !== "undefined" ? Math.round(performance.now() - start) : Date.now() - start;
      if (process.env.NODE_ENV === "development") {
        console.log(`⚡ ${label}: ${duration}ms`);
      }
      return duration;
    },
  };
}
