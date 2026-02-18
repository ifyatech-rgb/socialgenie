/**
 * Plan configurations: Trial, Creator ($39), Professional ($79), Enterprise ($199).
 * Creator: 20 credits | Professional: 50 credits | Enterprise: 150 credits.
 * Replace priceId with your Stripe Price IDs from Dashboard → Products → Price.
 */

export const PLANS = {
  trial: {
    name: "Free Trial",
    description: "Try before you subscribe",
    price: 0,
    priceId: null as string | null,
    videoCredits: 3,
    genieEdits: 5,
    customAvatarsLimit: 1,
    maxVideoLength: 60,
    exportQuality: "720p",
    hasWatermark: true,
    canUseCustomAvatar: true,
    canUseUGCAvatars: true,
    hasPriorityRendering: false,
    hasAPIAccess: false,
    hasWhiteLabel: false,
    hasTeamCollaboration: false,
    features: [
      "Unlimited AI Script Generation",
      "3 Video Credits",
      "5 Genie Edits",
      "1 Custom Avatar Upload",
      "Watermarked videos",
      "UGC Avatars",
    ],
    limits: {
      maxVideoLength: 60,
      maxVideosPerMonth: 3,
      genieEdits: 5,
      customAvatars: 1,
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
    customAvatarsLimit: 5,
    maxVideoLength: 90,
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
      "(≈ 13 to 20 videos depending on length)",
      "Unlimited AI Script Generation",
      "50 Genie Script Edits",
      "500+ AI Avatars",
      "Custom Avatar Upload (video & image)",
      "5 Custom Avatars",
      "720p Export",
      "Max 90 sec per video",
    ],
    limits: {
      maxVideoLength: 90,
      maxVideosPerMonth: 20,
      genieEdits: 50,
      customAvatars: 5,
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
    customAvatarsLimit: 15,
    maxVideoLength: 120,
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
      "(≈ 30 to 35 average videos)",
      "Everything in Creator plan",
      "150 Genie Edits",
      "100+ UGC Avatars",
      "1080p HD Export",
      "Priority Rendering",
      "Max 2 min per video",
    ],
    limits: {
      maxVideoLength: 120,
      maxVideosPerMonth: 50,
      genieEdits: 150,
      customAvatars: 15,
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

/** Video credit cost by duration (seconds). */
export function calculateVideoCreditCost(durationSeconds: number): number {
  if (durationSeconds <= 60) return 1;
  if (durationSeconds <= 120) return 2;
  if (durationSeconds <= 180) return 3;
  return 5;
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
