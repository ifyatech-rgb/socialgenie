/**
 * Plan configurations: Trial, Creator, Professional, Enterprise
 */

export const PLANS = {
  trial: {
    name: "Free Trial",
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
  },
  creator: {
    name: "Creator",
    price: 39,
    priceId: "price_creator_monthly",
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
      "(≈ 13–20 videos depending on length)",
      "Unlimited AI Script Generation",
      "50 Genie Script Edits",
      "500+ AI Avatars",
      "Custom Avatar Upload (video & image)",
      "5 Custom Avatars",
      "720p Export",
      "Max 90 sec per video",
    ],
  },
  professional: {
    name: "Professional",
    price: 79,
    priceId: "price_professional_monthly",
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
      "(≈ 30–35 average videos)",
      "Everything in Creator plan",
      "150 Genie Edits",
      "100+ UGC Avatars",
      "1080p HD Export",
      "Priority Rendering",
      "Max 2 min per video",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 199,
    priceId: "price_enterprise_monthly",
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
      "(≈ 80–100 videos average)",
      "Everything in Professional Plan",
      "500 Genie Edits",
      "Team Collaboration",
      "API Access",
      "White Label Option",
      "4K Export",
      "Dedicated Support",
      "Max 3–5 min per video",
    ],
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
