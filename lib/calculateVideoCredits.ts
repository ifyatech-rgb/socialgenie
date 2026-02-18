import { calculateVideoCreditCost } from "@/lib/plans";

/**
 * Estimate video duration in seconds from script text.
 * Uses ~2.5 words per second to match backend (api/heygen/generate).
 */
export function estimateScriptDuration(scriptText: string): number {
  const words = scriptText.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  const seconds = Math.ceil(words / 2.5);
  return Math.min(300, Math.max(15, seconds));
}

/**
 * Get credit cost for a script. Uses same formula as lib/plans.ts (and API).
 * - 0 to 60s = 1 credit, 61 to 120s = 2, 121 to 180s = 3, >180s = 5.
 */
export function getScriptCreditCost(scriptText: string): {
  estimatedDurationSeconds: number;
  creditCost: number;
} {
  const estimatedDurationSeconds = estimateScriptDuration(scriptText);
  const creditCost = estimatedDurationSeconds <= 0 ? 1 : calculateVideoCreditCost(estimatedDurationSeconds);
  return {
    estimatedDurationSeconds,
    creditCost: Math.max(1, creditCost),
  };
}
