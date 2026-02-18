/**
 * Plan-based feature access. Aligns with lib/plans.ts (trial, creator, professional, enterprise).
 * "starter" is treated as same tier as "creator" for compatibility.
 */

import { PLANS, type PlanKey } from "@/lib/plans";

const PLAN_LEVEL: Record<string, number> = {
  free: 0,
  trial: 0,
  starter: 1,
  creator: 1,
  professional: 2,
  enterprise: 3,
};

const FEATURE_LEVEL: Record<string, number> = {
  "custom-avatar": 1,
  "ai-script-generation": 1,
  "genie-edits": 1,
  "720p-video": 1,
  "ugc-avatars": 2,
  "1080p-video": 2,
  "priority-rendering": 2,
  "2min-videos": 2,
  "api-access": 3,
  "white-label": 3,
  "team-collaboration": 3,
  "4k-video": 3,
  "5min-videos": 3,
  "dedicated-support": 3,
};

/**
 * Returns true if the user's plan has access to the feature.
 */
export function checkPlanAccess(userPlan: string | null | undefined, feature: string): boolean {
  const plan = (userPlan ?? "trial").toLowerCase();
  const userLevel = PLAN_LEVEL[plan] ?? 0;
  const requiredLevel = FEATURE_LEVEL[feature] ?? 0;
  return userLevel >= requiredLevel;
}

/**
 * Use when you have subscription status; restricts access if status is not active/trialing.
 */
export function canAccessFeature(
  userPlan: string | null | undefined,
  feature: string,
  subscriptionStatus?: string | null
): boolean {
  const activeStatuses = ["active", "trialing"];
  if (subscriptionStatus && !activeStatuses.includes(subscriptionStatus.toLowerCase())) {
    return false;
  }
  return checkPlanAccess(userPlan, feature);
}

const DEFAULT_LIMITS = {
  maxVideoLength: 60,
  maxVideosPerMonth: 3,
  genieEdits: 5,
  customAvatars: 0,
  exportQuality: "720p",
  priorityRendering: false,
  teamCollaboration: false,
  apiAccess: false,
  whiteLabel: false,
};

/**
 * Returns plan limits for the given plan key. Uses limits from PLANS when available.
 */
export function getPlanLimits(userPlan: string | null | undefined): typeof DEFAULT_LIMITS {
  const key = (userPlan ?? "trial").toLowerCase() as PlanKey;
  const plan = PLANS[key];
  if (plan && "limits" in plan && plan.limits) {
    return { ...DEFAULT_LIMITS, ...plan.limits } as typeof DEFAULT_LIMITS;
  }
  if (plan) {
    return {
      maxVideoLength: plan.maxVideoLength ?? DEFAULT_LIMITS.maxVideoLength,
      maxVideosPerMonth: plan.videoCredits ?? DEFAULT_LIMITS.maxVideosPerMonth,
      genieEdits: plan.genieEdits ?? DEFAULT_LIMITS.genieEdits,
      customAvatars: plan.customAvatarsLimit ?? DEFAULT_LIMITS.customAvatars,
      exportQuality: plan.exportQuality ?? DEFAULT_LIMITS.exportQuality,
      priorityRendering: plan.hasPriorityRendering ?? DEFAULT_LIMITS.priorityRendering,
      teamCollaboration: plan.hasTeamCollaboration ?? DEFAULT_LIMITS.teamCollaboration,
      apiAccess: plan.hasAPIAccess ?? DEFAULT_LIMITS.apiAccess,
      whiteLabel: plan.hasWhiteLabel ?? DEFAULT_LIMITS.whiteLabel,
    };
  }
  return DEFAULT_LIMITS;
}
