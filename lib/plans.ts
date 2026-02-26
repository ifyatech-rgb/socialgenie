/**
 * Plan configurations: Trial, Creator ($39), Professional ($79). Enterprise kept for existing subscribers only.
 * Creator: 20 credits, 1 custom avatar | Professional: 50 credits, 5 custom avatars.
 * Replace priceId with your Stripe Price IDs from Dashboard → Products → Price.
 */

export const PLANS = {
  trial: {
    name: "Free Trial",
    description: "7 days free, then $39/month",
    price: 0,
    priceId: null as string | null,
    videoCredits: 10,
    genieEdits: 5,
    customAvatarsLimit: 0,
    maxVideoLength: null,
    exportQuality: "720p",
    hasWatermark: true,
    canUseCustomAvatar: false,
    canUseUGCAvatars: true,
    hasPriorityRendering: false,
    hasAPIAccess: false,
    hasWhiteLabel: false,
    hasTeamCollaboration: false,
    trialDays: 7,
    features: [
      "10 FREE Credits",
      "5 Genie Edits",
      "Create videos of any length",
      "Credits based on duration",
      "Valid for 7 days",
      "All features unlocked",
      "720p export",
      "SocialGenie watermark",
    ],
    limits: {
      maxVideoLength: null,
      maxVideosPerMonth: 10,
      genieEdits: 5,
      customAvatars: 0,
      exportQuality: "720p",
      priorityRendering: false,
      teamCollaboration: false,
      apiAccess: false,
      whiteLabel: false,
    },
  },
  creator: {
    name: "Creator",
    description: "Perfect for getting started",
    price: 39,
    priceId: process.env.STRIPE_PRICE_ID_CREATOR ?? "price_1T1NAMFCaF1zVyH5iIi8bosR",
    videoCredits: 20,
    genieEdits: 50,
    customAvatarsLimit: 1,
    maxVideoLength: null,
    exportQuality: "720p",
    hasWatermark: false,
    canUseCustomAvatar: true,
    canUseUGCAvatars: true,
    hasPriorityRendering: false,
    hasAPIAccess: false,
    hasWhiteLabel: false,
    hasTeamCollaboration: false,
    icon: "🟢",
    features: [
      "20 Video Credits / month",
      "Unlimited video length",
      "1–2 min = 2 credits, 2–3 min = 3 credits",
      "Unlimited AI Script Generation",
      "50 Genie Script Edits",
      "500+ AI Avatars",
      "1 Custom Avatar",
      "720p Export",
    ],
    limits: {
      maxVideoLength: null,
      maxVideosPerMonth: 20,
      genieEdits: 50,
      customAvatars: 1,
      exportQuality: "720p",
      priorityRendering: false,
      teamCollaboration: false,
      apiAccess: false,
      whiteLabel: false,
    },
  },
  professional: {
    name: "Professional",
    description: "For serious creators",
    price: 79,
    priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL ?? "price_1T1NB0FCaF1zVyH5jcqFqVLi",
    videoCredits: 50,
    genieEdits: 150,
    customAvatarsLimit: 5,
    maxVideoLength: null,
    exportQuality: "1080p",
    hasWatermark: false,
    canUseCustomAvatar: true,
    canUseUGCAvatars: true,
    hasPriorityRendering: true,
    hasAPIAccess: false,
    hasWhiteLabel: false,
    hasTeamCollaboration: false,
    icon: "🔵",
    badge: "Most Popular",
    features: [
      "50 Video Credits / month",
      "Unlimited video length",
      "1–2 min = 2 credits, 2–5 min = 5 credits",
      "Everything in Creator plan",
      "150 Genie Edits",
      "100+ UGC Avatars",
      "5 Custom Avatars",
      "1080p HD Export",
      "Priority Rendering",
    ],
    limits: {
      maxVideoLength: null,
      maxVideosPerMonth: 50,
      genieEdits: 150,
      customAvatars: 5,
      exportQuality: "1080p",
      priorityRendering: true,
      teamCollaboration: false,
      apiAccess: false,
      whiteLabel: false,
    },
  },
  enterprise: {
    name: "Enterprise",
    description: "For teams and agencies",
    price: 199,
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE ?? "price_1T1NBQFCaF1zVyH5ONhhPrLs",
    videoCredits: 150,
    genieEdits: 500,
    customAvatarsLimit: 999,
    maxVideoLength: 300,
    exportQuality: "4K",
    hasWatermark: false,
    canUseCustomAvatar: true,
    canUseUGCAvatars: true,
    hasPriorityRendering: true,
    hasAPIAccess: true,
    hasWhiteLabel: true,
    hasTeamCollaboration: true,
    icon: "🔴",
    features: [
      "150 Video Credits / month",
      "(≈ 80 to 100 videos average)",
      "Everything in Professional Plan",
      "500 Genie Edits",
      "Team Collaboration",
      "API Access",
      "White Label Option",
      "4K Export",
      "Dedicated Support",
      "Max 3 to 5 min per video",
    ],
    limits: {
      maxVideoLength: 300,
      maxVideosPerMonth: 150,
      genieEdits: 500,
      customAvatars: 999,
      exportQuality: "4K",
      priorityRendering: true,
      teamCollaboration: true,
      apiAccess: true,
      whiteLabel: true,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export interface PlanUser {
  plan?: string | null;
  videoCredits?: number | null;
  genieEdits?: number | null;
  genieEditsUsed?: number | null;
  videoCreditsUsed?: number | null;
  maxVideoLength?: number | null;
}

export function getPlan(planName: string | null | undefined) {
  const key = (planName ?? "trial").toLowerCase() as PlanKey;
  return PLANS[key] ?? PLANS.trial;
}

/**
 * Video credit cost by duration (seconds).
 * 0–60s = 1, 61–120s = 2, 121–180s = 3, 181–240s = 4, 241–300s = 5, 5+ min = ceil(sec/60).
 */
export function calculateVideoCreditCost(durationSeconds: number): number {
  if (durationSeconds <= 60) return 1;
  if (durationSeconds <= 120) return 2;
  if (durationSeconds <= 180) return 3;
  if (durationSeconds <= 240) return 4;
  if (durationSeconds <= 300) return 5;
  return Math.ceil(durationSeconds / 60);
}

/** Alias for calculateVideoCreditCost (any-length pricing). */
export function calculateCreditsForDuration(durationSeconds: number): number {
  return calculateVideoCreditCost(durationSeconds);
}

/**
 * Estimate credits for a script from word count (~150 words/min).
 * Returns estimated duration (seconds), credits needed, and a short breakdown string.
 */
export function getCreditsEstimate(scriptText: string): {
  estimatedDuration: number;
  creditsNeeded: number;
  breakdown: string;
} {
  const words = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedMinutes = words / 150;
  const estimatedSeconds = Math.ceil(estimatedMinutes * 60);
  const creditsNeeded = calculateVideoCreditCost(estimatedSeconds);
  const mins = Math.ceil(estimatedMinutes) || 1;
  return {
    estimatedDuration: estimatedSeconds,
    creditsNeeded,
    breakdown: `~${mins} min video = ${creditsNeeded} credit${creditsNeeded === 1 ? "" : "s"}`,
  };
}

export function canCreateVideo(user: PlanUser, estimatedDurationSeconds: number): boolean {
  const credits = user.videoCredits ?? 0;
  const cost = calculateVideoCreditCost(estimatedDurationSeconds);
  return credits >= cost;
}

export function canUseGenie(user: PlanUser): boolean {
  return (user.genieEdits ?? 0) > 0;
}

export function getRemainingVideoCredits(user: PlanUser): number {
  return Math.max(0, user.videoCredits ?? 0);
}

export function getRemainingGenieEdits(user: PlanUser): number {
  return Math.max(0, user.genieEdits ?? 0);
}
